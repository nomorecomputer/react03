import { useState, useEffect, useRef } from "react";

import { Modal } from "bootstrap";
import axios from "axios";
import { setCookie, getCookie, deleteCookie } from "./utility";
import "./App.css";

const API_PATH = import.meta.env.VITE_API_PATH;
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE });
const COOKIE_NAME = import.meta.env.VITE_COOKIE_NAME;
const INITIAL_PRODUCT = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: "",
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "nomorecomputer@gmail.com",
    password: "nomorecomputer",
  });
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(INITIAL_PRODUCT);
  const productModalRef = useRef(null);
  const [modelMode, setModalMode] = useState("");

  const getProducts = async () => {
    try {
      const response = await api.get(`/api${API_PATH}/admin/products/all`);
      setProducts(Object.values(response.data.products));
    } catch (error) {
      alert("登入失敗: " + error.response.message);
    }
  };

  useEffect(() => {
    productModalRef.current = new Modal("#productModal", {
      keyboard: false,
    });
    document
      .querySelector("#productModal")
      .addEventListener("hide.bs.modal", () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });
    const token = getCookie(COOKIE_NAME);
    if (token === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuth(false);
    } else {
      api.defaults.headers.common["Authorization"] = token;
      api
        .post(`/api/user/check`)
        .then((response) => {
          if (response.data.success) {
            setIsAuth(true);
            getProducts();
          } else {
            deleteCookie(COOKIE_NAME); //該cookie已經失效
            setIsAuth(false);
          }
        })
        .catch((error) => {
          setIsAuth(false);
          alert("無法正確驗證，請重新登入" + error.response.data.message);
        });
    }
  }, []);

  const handleInputChange = (e, fn) => {
    const { name, value, type, checked } = e.target;

    fn((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setArrayElementInput = (e, fn, index) => {
    const { name, value } = e.target;
    fn((prev) => {
      let newArray = [...prev[name]];
      newArray[index] = value;
      newArray = newArray.filter((url) => url.trim() !== "");
      if (newArray.length < 5) newArray.push("");
      return { ...prev, [name]: newArray };
    });
  };
  const signIn = async () => {
    try {
      const response = await api.post("/admin/signin", formData);
      const { token, expired } = response.data;
      setCookie(COOKIE_NAME, token, expired);
      api.defaults.headers.common["Authorization"] = token;
      setIsAuth(true);
      getProducts();
    } catch (error) {
      setIsAuth(false);
      alert(
        "登入失敗，請重新登入" + error.response?.data?.message || error.message
      );
    }
  };

  const openModal = (product, mode) => {
    console.log(mode);
    setModalMode(mode);
    setTempProduct((pre) => ({ ...pre, ...product }));
    productModalRef.current.show();
  };

  const closeModal = () => {
    productModalRef.current.hide();
  };
  const addImage = () => {
    setTempProduct((prev) => {
      let newArray = [...prev.imagesUrl].filter((url) => url.trim() !== "");
      if (newArray.length < 5) newArray.push("");
      return { ...prev, imagesUrl: newArray };
    });
  };
  const deleteImage = (index) => {
    setTempProduct((prev) => {
      prev.imagesUrl.splice(index, 1);
      const newImages = [...prev.imagesUrl];
      return { ...prev, imagesUrl: newImages };
    });
  };

  const updateProduct = async () => {
    console.log("in updateProduct");
    const url = `/api${API_PATH}/admin/product/${
      modelMode === "create" ? "" : tempProduct.id
    }`;
    const method = modelMode === "create" ? "post" : "put";
    const result = { ...tempProduct };
    result.origin_price = Number(result.origin_price);
    result.price = Number(result.price);
    result.is_enabled = result.is_enabled ? 1 : 0;

    try {
      await api[method](url, { data: result });
      //alert(`成功 ${modelMode === "create" ? "新增" : "更新"}`);
      closeModal();
      getProducts();
      alert(`成功 ${modelMode === "create" ? "新增" : "更新"}`);
    } catch (error) {
      alert("執行失敗：", error.response?.data?.message || error.message);
    }
  };
  const deleteProduct = async () => {
    console.log("in deleteProduct");
    try {
      await api.delete(`/api${API_PATH}/admin/product/${tempProduct.id}`);
      getProducts();
      closeModal();
      alert("成功刪除！");
    } catch (error) {
      alert(error.response?.data?.message || error.message);
      closeModal();
    }
  };
  return (
    <>
      {isAuth ? (
        <div>
          <div className="container">
            <div className="text-end mt-4">
              <button
                className="btn btn-primary"
                onClick={() => openModal(INITIAL_PRODUCT, "create")}
              >
                建立新的產品
              </button>
            </div>
            <table className="table mt-4">
              <thead>
                <tr>
                  <th width="120">分類</th>
                  <th>產品名稱</th>
                  <th width="120">原價</th>
                  <th width="120">售價</th>
                  <th width="100">是否啟用</th>
                  <th width="120">編輯</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.category}</td>
                    <td>{product.title}</td>
                    <td className="text-end">{product.origin_price}</td>
                    <td className="text-end">{product.price}</td>
                    <td>
                      <span
                        className={
                          product.is_enabled ? "text-success" : "text-danger"
                        }
                      >
                        {product.is_enabled ? "啟用" : "未啟用"}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => openModal(product, "edit")}
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openModal(product, "delete")}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="container login">
          <div className="row justify-content-center">
            <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
            <div className="col-8">
              <form id="form" className="form-signin">
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    name="username"
                    id="username"
                    placeholder="name@example.com"
                    value={formData.username}
                    onChange={(e) => handleInputChange(e, setFormData)}
                    required
                    autoFocus
                  />
                  <label htmlFor="username">Email address</label>
                </div>
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    id="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange(e, setFormData)}
                    required
                  />
                  <label htmlFor="password">Password</label>
                </div>
                <button
                  className="btn btn-lg btn-primary w-100 mt-3"
                  type="button"
                  onClick={signIn}
                >
                  登入
                </button>
              </form>
            </div>
          </div>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
      <div
        ref={productModalRef}
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div
              className={`modal-header bg-${
                modelMode === "delete" ? "danger" : "dark"
              } text-white`}
            >
              <h5 id="productModalLabel" className="modal-title">
                <span>
                  {modelMode === "delete"
                    ? "刪除產品"
                    : modelMode === "create"
                    ? "新增產品"
                    : "更新產品"}
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {modelMode === "delete" ? (
                <p className="fs-4">
                  確定要刪除：
                  <span className="text-danger">{tempProduct.title}</span>
                </p>
              ) : (
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-2">
                        <label
                          htmlFor="imageUrl"
                          className="form-label  fw-bold"
                        >
                          主圖片網址
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder="主圖片連結"
                          value={tempProduct.imageUrl}
                          onChange={(e) => handleInputChange(e, setTempProduct)}
                        />
                      </div>
                      {tempProduct.imageUrl && (
                        <img
                          className="img-fluid mb-4"
                          src={tempProduct.imageUrl}
                          alt=""
                        />
                      )}
                    </div>
                    {tempProduct.imagesUrl.map((url, index) => (
                      <div className="mb-2" key={index}>
                        <div className="mb-2">
                          <label
                            htmlFor={`imagesUrl${index}`}
                            className="form-label fw-bold mb-1 mt-4"
                          >
                            副圖片網址{index + 1}
                          </label>
                          <button
                            className="btn btn-outline-danger btn-sm ms-3"
                            onClick={() => deleteImage(index)}
                          >
                            刪除
                          </button>
                          <input
                            type="text"
                            name="imagesUrl"
                            id={`imagesUrl${index}`}
                            className="form-control"
                            placeholder="請輸入圖片連結"
                            value={url}
                            onChange={(e) =>
                              setArrayElementInput(e, setTempProduct, index)
                            }
                          />
                        </div>
                        {url.trim() && (
                          <img className="img-fluid" src={url.trim()} alt="" />
                        )}
                      </div>
                    ))}

                    <div>
                      <button
                        className="btn btn-outline-primary btn-sm d-block w-100 fw-bold"
                        onClick={addImage}
                        disabled={tempProduct.imagesUrl.length >= 5}
                      >
                        新增副圖片
                      </button>
                    </div>
                    <div>
                      {/* <button className="btn btn-outline-danger btn-sm d-block w-100 fw-bold">
                      刪除圖片
                    </button> */}
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label fw-bold">
                        標題
                      </label>
                      <input
                        id="title"
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={tempProduct.title}
                        onChange={(e) => handleInputChange(e, setTempProduct)}
                      />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label
                          htmlFor="category"
                          className="form-label fw-bold"
                        >
                          分類
                        </label>
                        <input
                          id="category"
                          type="text"
                          name="category"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={tempProduct.category}
                          onChange={(e) => handleInputChange(e, setTempProduct)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label fw-bold">
                          單位
                        </label>
                        <input
                          id="unit"
                          type="text"
                          name="unit"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={tempProduct.unit}
                          onChange={(e) => handleInputChange(e, setTempProduct)}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label
                          htmlFor="origin_price"
                          className="form-label fw-bold"
                        >
                          原價
                        </label>
                        <input
                          id="origin_price"
                          type="number"
                          min="0"
                          name="origin_price"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={tempProduct.origin_price}
                          onChange={(e) => handleInputChange(e, setTempProduct)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label fw-bold">
                          售價
                        </label>
                        <input
                          id="price"
                          type="number"
                          min="0"
                          name="price"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={tempProduct.price}
                          onChange={(e) => handleInputChange(e, setTempProduct)}
                        />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label
                        htmlFor="description"
                        className="form-label fw-bold"
                      >
                        產品描述
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={tempProduct.description}
                        onChange={(e) => handleInputChange(e, setTempProduct)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label fw-bold">
                        說明內容
                      </label>
                      <textarea
                        id="content"
                        name="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={tempProduct.content}
                        onChange={(e) => handleInputChange(e, setTempProduct)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          id="is_enabled"
                          name="is_enabled"
                          className="form-check-input "
                          type="checkbox"
                          checked={tempProduct.is_enabled}
                          onChange={(e) => handleInputChange(e, setTempProduct)}
                        />
                        <label
                          className="form-check-label d-block text-start fw-bold"
                          htmlFor="is_enabled"
                        >
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                // data-bs-dismiss="modal"
                onClick={closeModal}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (modelMode === "delete") deleteProduct();
                  else updateProduct();
                }}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
