import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/products";
const CART_API_URL = "http://localhost:8080/api/carts";
const CART_ID = 1;

function App() {
  const productsGridRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    imageUrl: "",
    description: "",
  });

  const [products, setProducts] = useState([]);

  const [cart, setCart] = useState({
    id: CART_ID,
    items: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartActionId, setCartActionId] = useState(null);

  const [editingProductId, setEditingProductId] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "",
    phone: "",
    address: "",
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutMessageType, setCheckoutMessageType] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =========================
  // NOTIFICATION
  // =========================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
  };

  // =========================
  // PRODUCT
  // =========================

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách sản phẩm");
      }

      const data = await response.json();

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showMessage(
          "Không thể tải danh sách sản phẩm",
          "error"
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // =========================
  // CART
  // =========================

  const loadCart = async () => {
    try {
      setCartLoading(true);

      const response = await fetch(
          `${CART_API_URL}/${CART_ID}`
      );

      if (!response.ok) {
        throw new Error("Không thể tải giỏ hàng");
      }

      const data = await response.json();

      setCart(data);
    } catch (error) {
      console.error(error);

      showMessage(
          "Không thể tải giỏ hàng",
          "error"
      );
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  // =========================
  // FORM
  // =========================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      stock: "",
      imageUrl: "",
      description: "",
    });

    setEditingProductId(null);
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);

    setForm({
      name: product.name || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      imageUrl: product.imageUrl || "",
      description: product.description || "",
    });

    window.scrollTo({
      top: 260,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      showMessage(
          "Vui lòng nhập tên sản phẩm",
          "error"
      );
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      showMessage(
          "Giá sản phẩm phải lớn hơn 0",
          "error"
      );
      return;
    }

    if (
        form.stock === "" ||
        Number(form.stock) < 0
    ) {
      showMessage(
          "Số lượng không hợp lệ",
          "error"
      );
      return;
    }

    try {
      setLoading(true);

      const isEditing =
          editingProductId !== null;

      const url = isEditing
          ? `${API_URL}/${editingProductId}`
          : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          imageUrl: form.imageUrl.trim(),
          description: form.description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
            isEditing
                ? "Cập nhật sản phẩm thất bại"
                : "Thêm sản phẩm thất bại"
        );
      }

      await response.json();

      showMessage(
          isEditing
              ? "Cập nhật sản phẩm thành công!"
              : "Thêm sản phẩm thành công!"
      );

      resetForm();

      await loadProducts();
    } catch (error) {
      console.error(error);

      showMessage(
          editingProductId !== null
              ? "Không thể cập nhật sản phẩm. Vui lòng kiểm tra máy chủ."
              : "Không thể thêm sản phẩm. Vui lòng kiểm tra máy chủ.",
          "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE PRODUCT
  // =========================

  const openDeleteModal = (product) => {
    setDeletingProduct(product);
  };

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }

    setDeletingProduct(null);
  };

  const handleDelete = async () => {
    if (!deletingProduct) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
          `${API_URL}/${deletingProduct.id}`,
          {
            method: "DELETE",
          }
      );

      if (!response.ok) {
        throw new Error(
            "Xóa sản phẩm thất bại"
        );
      }

      const deletedName =
          deletingProduct.name;

      setDeletingProduct(null);

      if (
          editingProductId ===
          deletingProduct.id
      ) {
        resetForm();
      }

      showMessage(
          `Đã xóa sản phẩm "${deletedName}" thành công!`
      );

      await loadProducts();
    } catch (error) {
      console.error(error);

      showMessage(
          "Không thể xóa sản phẩm. Vui lòng thử lại.",
          "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================
  // CART ACTIONS
  // =========================

  const addToCart = async (productId) => {
    try {
      setCartActionId(productId);

      const response = await fetch(
          `${CART_API_URL}/${CART_ID}/items?productId=${productId}&quantity=1`,
          {
            method: "POST",
          }
      );

      if (!response.ok) {
        throw new Error(
            "Không thể thêm sản phẩm vào giỏ"
        );
      }

      const data = await response.json();

      setCart(data);

      showMessage(
          "Đã thêm sản phẩm vào giỏ hàng!"
      );
    } catch (error) {
      console.error(error);

      showMessage(
          error.message ||
          "Không thể thêm sản phẩm vào giỏ hàng",
          "error"
      );
    } finally {
      setCartActionId(null);
    }
  };

  const updateCartQuantity = async (
      item,
      newQuantity
  ) => {
    if (newQuantity < 1) {
      await removeCartItem(item);
      return;
    }

    if (
        newQuantity >
        item.product.stock
    ) {
      showMessage(
          `Chỉ còn ${item.product.stock} sản phẩm trong kho`,
          "error"
      );
      return;
    }

    try {
      setCartActionId(item.id);

      const response = await fetch(
          `${CART_API_URL}/${CART_ID}/items/${item.id}?quantity=${newQuantity}`,
          {
            method: "PUT",
          }
      );

      if (!response.ok) {
        throw new Error(
            "Không thể cập nhật số lượng"
        );
      }

      const data = await response.json();

      setCart(data);
    } catch (error) {
      console.error(error);

      showMessage(
          "Không thể cập nhật số lượng",
          "error"
      );
    } finally {
      setCartActionId(null);
    }
  };

  const removeCartItem = async (item) => {
    try {
      setCartActionId(item.id);

      const response = await fetch(
          `${CART_API_URL}/${CART_ID}/items/${item.id}`,
          {
            method: "DELETE",
          }
      );

      if (!response.ok) {
        throw new Error(
            "Không thể xóa sản phẩm khỏi giỏ"
        );
      }

      const data = await response.json();

      setCart(data);

      showMessage(
          `Đã xóa "${item.product.name}" khỏi giỏ hàng`
      );
    } catch (error) {
      console.error(error);

      showMessage(
          "Không thể xóa sản phẩm khỏi giỏ hàng",
          "error"
      );
    } finally {
      setCartActionId(null);
    }
  };

  // =========================
  // CHECKOUT
  // =========================

  const handleCheckoutChange = (event) => {
    const { name, value } = event.target;

    setCheckoutForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCheckout = () => {
    if (cartItems.length === 0) {
      showMessage("Vui lòng thêm sản phẩm vào giỏ hàng trước.", "error");
      return;
    }

    setCheckoutMessage("");
    setCheckoutMessageType("");
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (checkoutLoading) {
      return;
    }

    setIsCheckoutOpen(false);
    setCheckoutMessage("");
    setCheckoutMessageType("");
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      setCheckoutMessage("Giỏ hàng đang trống.");
      setCheckoutMessageType("error");
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutMessage("");
      setCheckoutMessageType("");

      const response = await fetch(
          `http://localhost:8080/api/checkout/${CART_ID}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(checkoutForm),
          }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            "Đặt hàng không thành công."
        );
      }

      setCheckoutForm({
        customerName: "",
        phone: "",
        address: "",
      });

      setIsCheckoutOpen(false);
      setCheckoutMessage("");
      setCheckoutMessageType("");

      await loadCart();
      await loadProducts();

      showMessage(
          `Đặt hàng thành công! Mã đơn hàng #${data.id}`,
          "success"
      );
    } catch (error) {
      console.error(error);

      setCheckoutMessage(
          error.message || "Đặt hàng không thành công."
      );
      setCheckoutMessageType("error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // =========================
  // HELPERS
  // =========================

  const formatPrice = (price) => {
    return (
        new Intl.NumberFormat("vi-VN").format(
            Number(price) || 0
        ) + " ₫"
    );
  };

  const scrollProducts = (direction) => {
    const container = productsGridRef.current;

    if (!container) {
      return;
    }

    const card = container.querySelector(".product-card");

    if (!card) {
      return;
    }

    const gap = 12;
    const amount = card.getBoundingClientRect().width + gap;

    container.scrollBy({
      left: direction * amount,
      behavior: "smooth",
    });
  };

  const cartItems = cart.items || [];

  const totalCartQuantity = cartItems.reduce(
      (total, item) =>
          total + Number(item.quantity || 0),
      0
  );

  const totalCartPrice = cartItems.reduce(
      (total, item) =>
          total +
          Number(item.product.price || 0) *
          Number(item.quantity || 0),
      0
  );

  // =========================
  // UI
  // =========================

  return (
      <div className="app">

        {/* =========================
          TOPBAR
      ========================= */}

        <header className="topbar">
          <div className="topbar-inner">

            <div className="brand">
              <div className="brand-icon">
                S
              </div>

              <div>
                <div className="brand-name">
                  CỬA HÀNG
                </div>

                <div className="brand-subtitle">
                  Quản lý bán hàng
                </div>
              </div>
            </div>

            <div className="system-status">
              <span className="status-dot"></span>
              Hệ thống đang hoạt động
            </div>

          </div>
        </header>

        {/* =========================
          HERO
      ========================= */}

        <section className="hero">

          <div className="hero-background-circle circle-one"></div>
          <div className="hero-background-circle circle-two"></div>

          <div className="hero-content">

            <div className="hero-left">

              <div className="eyebrow">
                <span>✦</span>
                QUẢN LÝ BÁN HÀNG
              </div>

              <h1>
                Quản lý cửa hàng
                <br />
                <span>đơn giản hơn.</span>
              </h1>

              <p>
                Quản lý sản phẩm và giỏ hàng
                trong một giao diện trực quan,
                nhanh chóng và hiện đại.
              </p>

              <div className="hero-statistics">

                <div className="stat-item">
                  <strong>
                    {products.length}
                  </strong>
                  <span>Sản phẩm</span>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-item">
                  <strong>
                    {totalCartQuantity}
                  </strong>
                  <span>Trong giỏ</span>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-item">
                  <strong>
                    {formatPrice(
                        totalCartPrice
                    )}
                  </strong>
                  <span>Giá trị giỏ</span>
                </div>

              </div>

            </div>

            <div className="hero-decoration">

              <div className="orbit orbit-one"></div>
              <div className="orbit orbit-two"></div>

              <div className="decoration-card">
                <span>✦</span>
              </div>

            </div>

          </div>
        </section>

        {/* =========================
          MAIN
      ========================= */}

        <main className="main-container">

          {/* =========================
            PRODUCT FORM
        ========================= */}

          <section className="form-card">

            <div className="form-header">

              <div>

                <div className="section-label">
                  {editingProductId
                      ? "CHỈNH SỬA SẢN PHẨM"
                      : "THÊM SẢN PHẨM"}
                </div>

                <h2>
                  {editingProductId
                      ? "Chỉnh sửa sản phẩm"
                      : "Thêm sản phẩm mới"}
                </h2>

                <p>
                  {editingProductId
                      ? "Cập nhật thông tin sản phẩm bên dưới."
                      : "Điền thông tin bên dưới để đưa sản phẩm vào cửa hàng."}
                </p>

              </div>

              <div className="section-number">
                {editingProductId
                    ? "02"
                    : "01"}
              </div>

            </div>

            <div className="form-layout">

              <form
                  className="product-form"
                  onSubmit={handleSubmit}
              >

                <div className="field-group">

                  <div className="field-title">
                    <label htmlFor="name">
                      Tên sản phẩm
                    </label>

                    <span className="required">
                    Bắt buộc
                  </span>
                  </div>

                  <div className="input-wrapper">
                  <span className="input-icon">
                    ◇
                  </span>

                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Ví dụ: Áo thun Premium"
                    />
                  </div>

                </div>

                <div className="two-columns">

                  <div className="field-group">

                    <div className="field-title">
                      <label htmlFor="price">
                        Giá bán
                      </label>

                      <span>
                      Việt Nam đồng
                    </span>
                    </div>

                    <div className="input-wrapper">
                    <span className="input-icon">
                      ₫
                    </span>

                      <input
                          id="price"
                          name="price"
                          type="number"
                          min="0"
                          value={form.price}
                          onChange={handleChange}
                          placeholder="199000"
                      />
                    </div>

                  </div>

                  <div className="field-group">

                    <div className="field-title">
                      <label htmlFor="stock">
                        Số lượng
                      </label>

                      <span>
                      Tồn kho
                    </span>
                    </div>

                    <div className="input-wrapper">
                    <span className="input-icon">
                      #
                    </span>

                      <input
                          id="stock"
                          name="stock"
                          type="number"
                          min="0"
                          value={form.stock}
                          onChange={handleChange}
                          placeholder="100"
                      />
                    </div>

                  </div>

                </div>

                <div className="field-group">

                  <div className="field-title">
                    <label htmlFor="imageUrl">
                      Đường dẫn hình ảnh
                    </label>

                    <span>
                    Tùy chọn
                  </span>
                  </div>

                  <div className="input-wrapper">
                  <span className="input-icon">
                    ◎
                  </span>

                    <input
                        id="imageUrl"
                        name="imageUrl"
                        type="url"
                        value={form.imageUrl}
                        onChange={handleChange}
                        placeholder="https://images.example.com/san-pham.jpg"
                    />
                  </div>

                </div>

                <div className="field-group">

                  <div className="field-title">
                    <label htmlFor="description">
                      Mô tả sản phẩm
                    </label>

                    <span>
                    Tùy chọn
                  </span>
                  </div>

                  <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Mô tả ngắn gọn về sản phẩm..."
                      rows="5"
                  />

                </div>

                <div className="form-actions">

                  <button
                      className="submit-button"
                      type="submit"
                      disabled={loading}
                  >
                    {loading ? (
                        <>
                          <span className="spinner"></span>

                          {editingProductId
                              ? "Đang cập nhật..."
                              : "Đang thêm sản phẩm..."}
                        </>
                    ) : (
                        <>
                      <span>
                        {editingProductId
                            ? "✓"
                            : "+"}
                      </span>

                          {editingProductId
                              ? "Cập nhật sản phẩm"
                              : "Thêm sản phẩm"}
                        </>
                    )}
                  </button>

                  {editingProductId && (
                      <button
                          className="cancel-button"
                          type="button"
                          onClick={resetForm}
                          disabled={loading}
                      >
                        Hủy chỉnh sửa
                      </button>
                  )}

                </div>

              </form>

              {/* PREVIEW */}

              <aside className="preview-card">

                <div className="preview-header">
                  <span>XEM TRƯỚC</span>

                  <div className="preview-status">
                    <span></span>
                  </div>
                </div>

                <div className="preview-image">

                  {form.imageUrl ? (
                      <img
                          src={form.imageUrl}
                          alt={
                              form.name ||
                              "Sản phẩm"
                          }
                          onError={(event) => {
                            event.currentTarget.style.display =
                                "none";
                          }}
                      />
                  ) : (
                      <div className="empty-preview">
                        <div className="preview-icon">
                          ◇
                        </div>

                        <strong>
                          Ảnh sản phẩm
                        </strong>

                        <span>
                      Nhập đường dẫn để xem trước
                    </span>
                      </div>
                  )}

                </div>

                <div className="preview-content">

                <span className="preview-label">
                  SẢN PHẨM
                </span>

                  <h3>
                    {form.name ||
                        "Tên sản phẩm"}
                  </h3>

                  <p>
                    {form.description ||
                        "Mô tả sản phẩm sẽ hiển thị ở đây."}
                  </p>

                  <div className="preview-bottom">

                    <strong>
                      {form.price
                          ? formatPrice(
                              Number(form.price)
                          )
                          : "199.000 ₫"}
                    </strong>

                    <span>
                    {form.stock
                        ? `${form.stock} sản phẩm`
                        : "Chưa nhập số lượng"}
                  </span>

                  </div>

                </div>

              </aside>

            </div>

          </section>

          {/* =========================
            NOTIFICATION
        ========================= */}

          {message && (
              <div
                  className={`notification ${messageType}`}
              >
                <div className="notification-icon">
                  {messageType === "error"
                      ? "!"
                      : "✓"}
                </div>

                <div>
                  <strong>
                    {messageType === "error"
                        ? "Có vấn đề xảy ra"
                        : "Thành công"}
                  </strong>

                  <span>{message}</span>
                </div>

                <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setMessageType("");
                    }}
                >
                  ×
                </button>
              </div>
          )}

          {/* =========================
            CART
        ========================= */}

          <div className="shop-workspace">

            <section className="cart-section">

              <div className="cart-header">

                <div>

                  <div className="section-label">
                    GIỎ HÀNG
                  </div>

                  <h2>
                    Giỏ hàng của bạn
                  </h2>

                  <p>
                    {totalCartQuantity > 0
                        ? `${totalCartQuantity} sản phẩm đang được chọn`
                        : "Chưa có sản phẩm trong giỏ hàng"}
                  </p>

                </div>

                <div className="cart-summary-badge">
              <span>
                {totalCartQuantity}
              </span>

                  <small>
                    sản phẩm
                  </small>
                </div>

              </div>

              {cartLoading ? (
                  <div className="loading-box">
                    <span className="large-spinner"></span>

                    <p>
                      Đang tải giỏ hàng...
                    </p>
                  </div>
              ) : cartItems.length === 0 ? (
                  <div className="cart-empty">

                    <div className="cart-empty-icon">
                      🛒
                    </div>

                    <h3>
                      Giỏ hàng đang trống
                    </h3>

                    <p>
                      Hãy thêm sản phẩm bên dưới
                      để bắt đầu mua hàng.
                    </p>

                  </div>
              ) : (
                  <div className="cart-layout">

                    <div className="cart-items">

                      {cartItems.map((item) => {

                        const isProcessing =
                            cartActionId === item.id;

                        return (
                            <article
                                className="cart-item-card"
                                key={item.id}
                            >

                              <div className="cart-item-image">

                                {item.product.imageUrl ? (
                                    <img
                                        src={
                                          item.product.imageUrl
                                        }
                                        alt={
                                          item.product.name
                                        }
                                    />
                                ) : (
                                    <span>◇</span>
                                )}

                              </div>

                              <div className="cart-item-main">

                                <div className="cart-item-top">

                                  <div>
                            <span className="cart-item-category">
                              SẢN PHẨM
                            </span>

                                    <h3>
                                      {item.product.name}
                                    </h3>
                                  </div>

                                  <button
                                      type="button"
                                      className="cart-remove-button"
                                      onClick={() =>
                                          removeCartItem(
                                              item
                                          )
                                      }
                                      disabled={
                                        isProcessing
                                      }
                                      aria-label="Xóa khỏi giỏ"
                                  >
                                    ×
                                  </button>

                                </div>

                                <p className="cart-item-description">
                                  {item.product.description ||
                                      "Sản phẩm chưa có mô tả."}
                                </p>

                                <div className="cart-item-bottom">

                                  <div className="cart-item-price">
                                    <strong>
                                      {formatPrice(
                                          item.product
                                              .price
                                      )}
                                    </strong>

                                    <span>
                              Còn{" "}
                                      {
                                        item.product
                                            .stock
                                      }{" "}
                                      sản phẩm
                            </span>
                                  </div>

                                  <div className="quantity-control">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateCartQuantity(
                                                item,
                                                item.quantity - 1
                                            )
                                        }
                                        disabled={
                                          isProcessing
                                        }
                                    >
                                      −
                                    </button>

                                    <span>
                              {isProcessing ? (
                                  <span className="quantity-spinner"></span>
                              ) : (
                                  item.quantity
                              )}
                            </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateCartQuantity(
                                                item,
                                                item.quantity + 1
                                            )
                                        }
                                        disabled={
                                            isProcessing ||
                                            item.quantity >=
                                            item.product
                                                .stock
                                        }
                                    >
                                      +
                                    </button>

                                  </div>

                                  <strong className="cart-item-subtotal">
                                    {formatPrice(
                                        Number(
                                            item.product
                                                .price
                                        ) *
                                        Number(
                                            item.quantity
                                        )
                                    )}
                                  </strong>

                                </div>

                              </div>

                            </article>
                        );
                      })}

                    </div>

                    {/* CART TOTAL / CHECKOUT */}

                    <aside
                        className={`cart-total-card ${
                            isCheckoutOpen ? "checkout-panel-open" : ""
                        }`}
                    >

                      {!isCheckoutOpen ? (
                          <>
                            <div className="cart-total-label">
                              TÓM TẮT ĐƠN HÀNG
                            </div>

                            <div className="cart-total-heading-row">
                              <div>
                                <h3>
                                  Tổng giỏ hàng
                                </h3>

                                <span className="cart-total-subtitle">
                                Kiểm tra lại đơn hàng trước khi đặt
                              </span>
                              </div>

                              <div className="checkout-mini-icon">
                                ✓
                              </div>
                            </div>

                            <div className="cart-total-lines">

                              <div>
                              <span>
                                Số lượng
                              </span>

                                <strong>
                                  {totalCartQuantity}
                                </strong>
                              </div>

                              <div>
                              <span>
                                Tạm tính
                              </span>

                                <strong>
                                  {formatPrice(totalCartPrice)}
                                </strong>
                              </div>

                              <div>
                              <span>
                                Phí vận chuyển
                              </span>

                                <strong className="free-text">
                                  Miễn phí
                                </strong>
                              </div>

                            </div>

                            <div className="cart-total-divider"></div>

                            <div className="cart-grand-total">
                            <span>
                              Tổng cộng
                            </span>

                              <strong>
                                {formatPrice(totalCartPrice)}
                              </strong>
                            </div>

                            <button
                                type="button"
                                className="checkout-preview-button"
                                onClick={openCheckout}
                            >
                            <span>
                              Đặt hàng
                            </span>

                              <span>→</span>
                            </button>

                            <div className="secure-note">
                              <span>✓</span>
                              Thông tin của bạn được bảo mật
                            </div>
                          </>
                      ) : (
                          <form
                              className="checkout-form"
                              onSubmit={handleCheckout}
                          >
                            <div className="checkout-panel-header">
                              <div>
                                <div className="cart-total-label">
                                  ĐẶT HÀNG
                                </div>

                                <h3>
                                  Thông tin nhận hàng
                                </h3>

                                <p>
                                  Nhập thông tin để hoàn tất đơn hàng.
                                </p>
                              </div>

                              <button
                                  type="button"
                                  className="checkout-close-button"
                                  onClick={closeCheckout}
                                  disabled={checkoutLoading}
                                  aria-label="Đóng thông tin đặt hàng"
                              >
                                ×
                              </button>
                            </div>

                            <div className="checkout-order-preview">
                              <div>
                              <span>
                                {totalCartQuantity} sản phẩm
                              </span>

                                <strong>
                                  {formatPrice(totalCartPrice)}
                                </strong>
                              </div>

                              <small>
                                Đơn hàng sẽ được lưu ngay vào hệ thống.
                              </small>
                            </div>

                            <div className="checkout-field">
                              <label htmlFor="checkout-customer-name">
                                Họ và tên
                              </label>

                              <input
                                  id="checkout-customer-name"
                                  name="customerName"
                                  type="text"
                                  value={checkoutForm.customerName}
                                  onChange={handleCheckoutChange}
                                  placeholder="Nhập họ và tên"
                                  autoComplete="name"
                                  required
                              />
                            </div>

                            <div className="checkout-field">
                              <label htmlFor="checkout-phone">
                                Số điện thoại
                              </label>

                              <input
                                  id="checkout-phone"
                                  name="phone"
                                  type="tel"
                                  value={checkoutForm.phone}
                                  onChange={handleCheckoutChange}
                                  placeholder="Nhập số điện thoại"
                                  autoComplete="tel"
                                  required
                              />
                            </div>

                            <div className="checkout-field">
                              <label htmlFor="checkout-address">
                                Địa chỉ nhận hàng
                              </label>

                              <textarea
                                  id="checkout-address"
                                  name="address"
                                  value={checkoutForm.address}
                                  onChange={handleCheckoutChange}
                                  placeholder="Nhập địa chỉ nhận hàng"
                                  rows="4"
                                  autoComplete="street-address"
                                  required
                              />
                            </div>

                            <button
                                type="submit"
                                className="checkout-submit-button"
                                disabled={checkoutLoading}
                            >
                              {checkoutLoading ? (
                                  <>
                                    <span className="button-spinner"></span>
                                    Đang đặt hàng...
                                  </>
                              ) : (
                                  <>
                                    Xác nhận đặt hàng
                                    <span>→</span>
                                  </>
                              )}
                            </button>

                            {checkoutMessage && (
                                <div
                                    className={`checkout-message ${checkoutMessageType}`}
                                >
                                  {checkoutMessage}
                                </div>
                            )}

                            <button
                                type="button"
                                className="checkout-cancel-button"
                                onClick={closeCheckout}
                                disabled={checkoutLoading}
                            >
                              Quay lại giỏ hàng
                            </button>
                          </form>
                      )}

                    </aside>

                  </div>
              )}

            </section>

            {/* =========================
            PRODUCTS
        ========================= */}

            <section className="products-section">

              <div className="products-header">

                <div>

                  <div className="section-label">
                    KHO SẢN PHẨM
                  </div>

                  <h2>
                    Sản phẩm
                  </h2>

                  <p>
                    {products.length} sản phẩm
                    đang có trong hệ thống
                  </p>

                </div>

                <div className="products-header-actions">

                  <button
                      type="button"
                      className="product-nav-button"
                      onClick={() => scrollProducts(-1)}
                      aria-label="Xem sản phẩm trước"
                  >
                    ‹
                  </button>

                  <button
                      type="button"
                      className="product-nav-button"
                      onClick={() => scrollProducts(1)}
                      aria-label="Xem sản phẩm tiếp theo"
                  >
                    ›
                  </button>

                  <div className="product-count">
                    {products.length}
                  </div>

                </div>

              </div>

              {loadingProducts ? (
                  <div className="loading-box">

                    <span className="large-spinner"></span>

                    <p>
                      Đang tải sản phẩm...
                    </p>

                  </div>
              ) : products.length === 0 ? (
                  <div className="empty-products">

                    <div>◇</div>

                    <h3>
                      Chưa có sản phẩm
                    </h3>

                    <p>
                      Hãy thêm sản phẩm đầu tiên
                      cho cửa hàng.
                    </p>

                  </div>
              ) : (
                  <div className="products-grid" ref={productsGridRef}>

                    {products.map((product) => (

                        <article
                            className="product-card"
                            key={product.id}
                        >

                          <div className="product-card-image">

                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                />
                            ) : (
                                <div className="no-image">
                                  <span>◇</span>
                                  Chưa có hình ảnh
                                </div>
                            )}

                            <div className="stock-badge">
                              Còn {product.stock}
                            </div>

                          </div>

                          <div className="product-card-content">

                            <h3>
                              {product.name}
                            </h3>

                            <p>
                              {product.description ||
                                  "Chưa có mô tả sản phẩm."}
                            </p>

                            <div className="product-card-bottom">

                              <strong>
                                {formatPrice(
                                    product.price
                                )}
                              </strong>

                              <span>
                        {product.stock} sản phẩm
                      </span>

                            </div>

                            <div className="product-card-actions">

                              <button
                                  type="button"
                                  className="cart-button"
                                  onClick={() =>
                                      addToCart(
                                          product.id
                                      )
                                  }
                                  disabled={
                                      cartActionId ===
                                      product.id ||
                                      product.stock <= 0
                                  }
                              >
                                {cartActionId ===
                                product.id ? (
                                    <>
                                      <span className="button-spinner"></span>
                                      Đang thêm
                                    </>
                                ) : product.stock <=
                                0 ? (
                                    "Hết hàng"
                                ) : (
                                    "+ Giỏ hàng"
                                )}
                              </button>

                              <button
                                  type="button"
                                  className="edit-button"
                                  onClick={() =>
                                      handleEdit(product)
                                  }
                              >
                                Chỉnh sửa
                              </button>

                              <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() =>
                                      openDeleteModal(
                                          product
                                      )
                                  }
                              >
                                Xóa
                              </button>

                            </div>

                          </div>

                        </article>

                    ))}

                  </div>
              )}

            </section>

          </div>

        </main>

        {/* =========================
          DELETE MODAL
      ========================= */}

        {deletingProduct && (
            <div
                className="modal-overlay"
                onMouseDown={
                  closeDeleteModal
                }
            >

              <div
                  className="delete-modal"
                  onMouseDown={(event) =>
                      event.stopPropagation()
                  }
              >

                <div className="delete-modal-icon">
                  !
                </div>

                <div className="delete-modal-content">

                  <div className="delete-modal-label">
                    XÁC NHẬN XÓA
                  </div>

                  <h3>
                    Xóa sản phẩm?
                  </h3>

                  <p>
                    Bạn có chắc chắn muốn xóa
                    sản phẩm{" "}
                    <strong>
                      “{deletingProduct.name}”
                    </strong>
                    ? Hành động này không thể
                    hoàn tác.
                  </p>

                </div>

                <div className="delete-modal-actions">

                  <button
                      type="button"
                      className="modal-cancel-button"
                      onClick={
                        closeDeleteModal
                      }
                      disabled={deleting}
                  >
                    Hủy
                  </button>

                  <button
                      type="button"
                      className="modal-delete-button"
                      onClick={handleDelete}
                      disabled={deleting}
                  >
                    {deleting ? (
                        <>
                          <span className="modal-spinner"></span>
                          Đang xóa...
                        </>
                    ) : (
                        <>
                          <span>×</span>
                          Xóa sản phẩm
                        </>
                    )}
                  </button>

                </div>

              </div>

            </div>
        )}

        {/* =========================
          FOOTER
      ========================= */}

        <footer className="footer">

        <span>
          © 2026 Cửa hàng của bạn
        </span>

          <span>
          Hệ thống quản lý bán hàng
        </span>

        </footer>

      </div>
  );
}

export default App;