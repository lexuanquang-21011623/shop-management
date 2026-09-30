package com.shop.shopbackend.cart;

import com.shop.shopbackend.product.Product;
import com.shop.shopbackend.product.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public Cart getCart(Long cartId) {
        return cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));
    }

    @Transactional
    public Cart addProduct(Long cartId, Long productId, Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Số lượng phải lớn hơn 0");
        }

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (product.getStock() < quantity) {
            throw new RuntimeException("Sản phẩm không đủ số lượng tồn kho");
        }

        CartItem cartItem = cartItemRepository
                .findByCartIdAndProductId(cartId, productId)
                .orElse(null);

        if (cartItem == null) {
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
        } else {
            int newQuantity = cartItem.getQuantity() + quantity;

            if (newQuantity > product.getStock()) {
                throw new RuntimeException("Số lượng trong giỏ vượt quá tồn kho");
            }

            cartItem.setQuantity(newQuantity);
        }

        cartItemRepository.save(cartItem);

        return cart;
    }

    @Transactional
    public Cart updateQuantity(Long cartId, Long cartItemId, Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Số lượng phải lớn hơn 0");
        }

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ"));

        if (!cartItem.getCart().getId().equals(cartId)) {
            throw new RuntimeException("Sản phẩm không thuộc giỏ hàng");
        }

        if (quantity > cartItem.getProduct().getStock()) {
            throw new RuntimeException("Số lượng vượt quá tồn kho");
        }

        cartItem.setQuantity(quantity);

        cartItemRepository.save(cartItem);

        return cartItem.getCart();
    }

    @Transactional
    public Cart removeItem(Long cartId, Long cartItemId) {

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ"));

        if (!cartItem.getCart().getId().equals(cartId)) {
            throw new RuntimeException("Sản phẩm không thuộc giỏ hàng");
        }

        Cart cart = cartItem.getCart();

        cartItemRepository.delete(cartItem);

        return cart;
    }
}