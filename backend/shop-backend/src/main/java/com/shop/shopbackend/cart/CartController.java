package com.shop.shopbackend.cart;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carts")
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    private final CartRepository cartRepository;
    private final CartService cartService;

    public CartController(
            CartRepository cartRepository,
            CartService cartService
    ) {
        this.cartRepository = cartRepository;
        this.cartService = cartService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Cart createCart() {
        Cart cart = new Cart();
        return cartRepository.save(cart);
    }

    @GetMapping("/{cartId}")
    public Cart getCart(@PathVariable Long cartId) {
        return cartService.getCart(cartId);
    }

    @PostMapping("/{cartId}/items")
    public Cart addProduct(
            @PathVariable Long cartId,
            @RequestParam Long productId,
            @RequestParam Integer quantity
    ) {
        return cartService.addProduct(cartId, productId, quantity);
    }

    @PutMapping("/{cartId}/items/{cartItemId}")
    public Cart updateQuantity(
            @PathVariable Long cartId,
            @PathVariable Long cartItemId,
            @RequestParam Integer quantity
    ) {
        return cartService.updateQuantity(
                cartId,
                cartItemId,
                quantity
        );
    }

    @DeleteMapping("/{cartId}/items/{cartItemId}")
    public Cart removeItem(
            @PathVariable Long cartId,
            @PathVariable Long cartItemId
    ) {
        return cartService.removeItem(
                cartId,
                cartItemId
        );
    }
}