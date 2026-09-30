package com.shop.shopbackend.order;

import com.shop.shopbackend.cart.Cart;
import com.shop.shopbackend.cart.CartItem;
import com.shop.shopbackend.cart.CartItemRepository;
import com.shop.shopbackend.cart.CartRepository;
import com.shop.shopbackend.product.Product;
import com.shop.shopbackend.product.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CheckoutService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public CheckoutService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Order checkout(Long cartId, CheckoutRequest request) {

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy giỏ hàng"
                ));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng đang trống");
        }

        /*
         * Sắp xếp theo productId để nếu có nhiều sản phẩm,
         * các transaction luôn lấy khóa theo cùng một thứ tự.
         * Điều này giúp giảm nguy cơ deadlock.
         */
        List<CartItem> cartItems = new ArrayList<>(cart.getItems());

        cartItems.sort(
                Comparator.comparing(
                        item -> item.getProduct().getId()
                )
        );

        /*
         * Khóa từng product bằng PESSIMISTIC_WRITE.
         * Transaction khác muốn sửa cùng product phải chờ.
         */
        List<Product> lockedProducts = new ArrayList<>();

        for (CartItem cartItem : cartItems) {

            Long productId = cartItem.getProduct().getId();

            Product product = productRepository
                    .findByIdForUpdate(productId)
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sản phẩm"
                    ));

            if (product.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException(
                        "Sản phẩm \"" +
                                product.getName() +
                                "\" không đủ số lượng tồn kho"
                );
            }

            lockedProducts.add(product);
        }

        /*
         * Tính tổng tiền.
         */
        BigDecimal total = BigDecimal.ZERO;

        for (int i = 0; i < cartItems.size(); i++) {

            CartItem cartItem = cartItems.get(i);
            Product product = lockedProducts.get(i);

            BigDecimal itemTotal = product.getPrice()
                    .multiply(
                            BigDecimal.valueOf(
                                    cartItem.getQuantity()
                            )
                    );

            total = total.add(itemTotal);
        }

        /*
         * Tạo Order.
         */
        Order order = new Order();

        order.setCustomerName(request.getCustomerName());
        order.setPhone(request.getPhone());
        order.setAddress(request.getAddress());
        order.setTotal(total);
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        /*
         * Tạo OrderItem và trừ tồn kho.
         */
        for (int i = 0; i < cartItems.size(); i++) {

            CartItem cartItem = cartItems.get(i);
            Product product = lockedProducts.get(i);

            OrderItem orderItem = new OrderItem();

            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());

            /*
             * Lưu giá tại thời điểm mua.
             * Sau này giá sản phẩm thay đổi thì đơn cũ
             * vẫn giữ đúng giá lúc khách mua.
             */
            orderItem.setPrice(product.getPrice());

            order.getItems().add(orderItem);

            /*
             * Trừ tồn kho.
             */
            product.setStock(
                    product.getStock() - cartItem.getQuantity()
            );
        }

        /*
         * Lưu Order.
         * Cascade sẽ lưu luôn OrderItem.
         */
        Order savedOrder = orderRepository.save(order);

        /*
         * Xóa toàn bộ sản phẩm trong giỏ sau khi checkout.
         */
        cartItemRepository.deleteAll(cartItems);

        return savedOrder;
    }
}