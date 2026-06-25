import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminProducts() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            const res = await axios.get('http://localhost:3001/products');
            setProducts(res.data);
        };
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?")) {
            try {
                await axios.delete(`http://localhost:3001/products/${id}`);
                setProducts(products.filter(p => p.id !== id));
                alert('Đã xóa thành công!');
            } catch (err) {
                alert('Lỗi khi xóa sản phẩm');
            }
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                <h2>Quản Lý Sản Phẩm</h2>
                <button className="btn-submit" style={{ width: 'auto', padding: '10px 20px' }}>
                    <i className="fa-solid fa-plus"></i> Thêm Sản Phẩm Mới
                </button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                        <th style={{ padding: '15px' }}>ID</th>
                        <th>Hình ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Giá bán</th>
                        <th>Tồn kho</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{product.id}</td>
                            <td>
                                <img src={`/assets/images/${product.image}`} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} onError={(e) => e.target.src='https://via.placeholder.com/50'} />
                            </td>
                            <td style={{ maxWidth: '300px', fontWeight: '500' }}>{product.name}</td>
                            <td style={{ color: '#e53e3e', fontWeight: 'bold' }}>{product.price.toLocaleString('vi-VN')}đ</td>
                            <td>
                                <span style={{ padding: '3px 8px', backgroundColor: product.stock > 0 ? '#d4edda' : '#f8d7da', color: product.stock > 0 ? '#155724' : '#721c24', borderRadius: '10px', fontSize: '14px' }}>
                                    {product.stock}
                                </span>
                            </td>
                            <td>
                                <button style={{ padding: '6px 12px', marginRight: '8px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button onClick={() => handleDelete(product.id)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
