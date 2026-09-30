import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/products";

function App() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    imageUrl: "",
    description: "",
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingProductId, setEditingProductId] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

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
      showMessage("Không thể tải danh sách sản phẩm", "error");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
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
      top: 300,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      showMessage("Vui lòng nhập tên sản phẩm", "error");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      showMessage("Giá sản phẩm phải lớn hơn 0", "error");
      return;
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      showMessage("Số lượng không hợp lệ", "error");
      return;
    }

    try {
      setLoading(true);

      const isEditing = editingProductId !== null;

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
        throw new Error("Xóa sản phẩm thất bại");
      }

      setDeletingProduct(null);

      if (editingProductId === deletingProduct.id) {
        resetForm();
      }

      showMessage(
          `Đã xóa sản phẩm "${deletingProduct.name}" thành công!`
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

  const formatPrice = (price) => {
    return (
        new Intl.NumberFormat("vi-VN").format(price || 0) +
        " ₫"
    );
  };

  return (
      <div className="app">
        {/* Thanh đầu trang */}
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <div className="brand-icon">S</div>

              <div>
                <div className="brand-name">CỬA HÀNG</div>
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

        {/* Hero */}
        <section className="hero">
          <div className="hero-background-circle circle-one"></div>
          <div className="hero-background-circle circle-two"></div>

          <div className="hero-content">
            <div className="hero-left">
              <div className="eyebrow">
                <span>✦</span>
                QUẢN LÝ SẢN PHẨM
              </div>

              <h1>
                Quản lý sản phẩm
                <br />
                <span>đơn giản hơn.</span>
              </h1>

              <p>
                Thêm và quản lý sản phẩm của cửa hàng với giao diện
                trực quan, nhanh chóng và hiện đại.
              </p>

              <div className="hero-statistics">
                <div className="stat-item">
                  <strong>{products.length}</strong>
                  <span>Sản phẩm</span>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-item">
                  <strong>100%</strong>
                  <span>Đồng bộ dữ liệu</span>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-item">
                  <strong>24/7</strong>
                  <span>Hoạt động</span>
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

        <main className="main-container">
          {/* Form */}
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
                {editingProductId ? "02" : "01"}
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
                    <span className="input-icon">◇</span>

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

                      <span>Việt Nam đồng</span>
                    </div>

                    <div className="input-wrapper">
                      <span className="input-icon">₫</span>

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

                      <span>Tồn kho</span>
                    </div>

                    <div className="input-wrapper">
                      <span className="input-icon">#</span>

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

                    <span>Tùy chọn</span>
                  </div>

                  <div className="input-wrapper">
                    <span className="input-icon">◎</span>

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

                    <span>Tùy chọn</span>
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
                        {editingProductId ? "✓" : "+"}
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

              {/* Preview */}
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
                          alt={form.name || "Sản phẩm"}
                          onError={(event) => {
                            event.currentTarget.style.display =
                                "none";
                          }}
                      />
                  ) : (
                      <div className="empty-preview">
                        <div className="preview-icon">◇</div>

                        <strong>Ảnh sản phẩm</strong>

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
                    {form.name || "Tên sản phẩm"}
                  </h3>

                  <p>
                    {form.description ||
                        "Mô tả sản phẩm sẽ hiển thị ở đây."}
                  </p>

                  <div className="preview-bottom">
                    <strong>
                      {form.price
                          ? formatPrice(Number(form.price))
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

          {/* Thông báo */}
          {message && (
              <div className={`notification ${messageType}`}>
                <div className="notification-icon">
                  {messageType === "error" ? "!" : "✓"}
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
                    onClick={() => {
                      setMessage("");
                      setMessageType("");
                    }}
                >
                  ×
                </button>
              </div>
          )}

          {/* Danh sách sản phẩm */}
          <section className="products-section">
            <div className="products-header">
              <div>
                <div className="section-label">
                  KHO SẢN PHẨM
                </div>

                <h2>Sản phẩm</h2>

                <p>
                  {products.length} sản phẩm đang có trong hệ thống
                </p>
              </div>

              <div className="product-count">
                {products.length}
              </div>
            </div>

            {loadingProducts ? (
                <div className="loading-box">
                  <span className="large-spinner"></span>
                  <p>Đang tải sản phẩm...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="empty-products">
                  <div>◇</div>

                  <h3>Chưa có sản phẩm</h3>

                  <p>
                    Hãy thêm sản phẩm đầu tiên cho cửa hàng.
                  </p>
                </div>
            ) : (
                <div className="products-grid">
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
                          <h3>{product.name}</h3>

                          <p>
                            {product.description ||
                                "Chưa có mô tả sản phẩm."}
                          </p>

                          <div className="product-card-bottom">
                            <strong>
                              {formatPrice(product.price)}
                            </strong>

                            <span>
                        {product.stock} sản phẩm
                      </span>
                          </div>

                          <div className="product-card-actions">
                            <button
                                type="button"
                                className="edit-button"
                                onClick={() => handleEdit(product)}
                            >
                              Chỉnh sửa
                            </button>

                            <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                    openDeleteModal(product)
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
        </main>

        {/* Modal xác nhận xóa */}
        {deletingProduct && (
            <div
                className="modal-overlay"
                onMouseDown={closeDeleteModal}
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

                  <h3>Xóa sản phẩm?</h3>

                  <p>
                    Bạn có chắc chắn muốn xóa sản phẩm{" "}
                    <strong>
                      “{deletingProduct.name}”
                    </strong>
                    ? Hành động này không thể hoàn tác.
                  </p>
                </div>

                <div className="delete-modal-actions">
                  <button
                      type="button"
                      className="modal-cancel-button"
                      onClick={closeDeleteModal}
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

        <footer className="footer">
          <span>© 2026 Cửa hàng của bạn</span>
          <span>Hệ thống quản lý bán hàng</span>
        </footer>
      </div>
  );
}

export default App;