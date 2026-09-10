BẢN VÁ: KHÔNG GÁN ẢNH SAI + TRANG CHỦ KHÔNG CÒN HAI MẢNG TRỐNG

Chép đè các file trong ZIP vào đúng thư mục gốc dự án.

Đã sửa:
1) LocationCard.jsx
   - Xóa fallback ảnh đường Lê Hồng Phong dùng chung cho địa điểm chưa có ảnh.
   - Nếu địa điểm không có ảnh đã xác minh thì không dựng khung ảnh giả.

2) LocationDetailContent.jsx
   - Xóa fallback ảnh địa phương dùng chung trong chi tiết.

3) PanoramaModal.jsx
   - Xóa fallback ảnh chung.
   - Nếu chưa có ảnh 360° thì hiển thị trạng thái "chưa có ảnh 360°", không lấy ảnh nơi khác.
   - Nếu có ảnh chính xác của địa điểm nhưng chưa có panorama thì chỉ dùng chính ảnh đó để minh họa.

4) MediaImage.jsx
   - Nếu src rỗng hoặc ảnh lỗi và không có fallback hợp lệ thì ẩn ảnh thay vì tải URL rỗng / ảnh khác.

5) HomePage.jsx
   - Giữ lớp ảnh chính bằng object-contain để thấy đủ ảnh gốc.
   - Dùng CHÍNH CÙNG ẢNH làm lớp nền object-cover phía sau, giảm blur/overlay để hai bên có hình thật thay vì mảng xanh/trống.
   - Không kéo méo tỷ lệ ảnh.

Sau khi chép đè:
  npm run dev
  Ctrl + F5

Không cần thay locations.json: dữ liệu hiện tại vẫn giữ 20 ảnh public đã xác minh; các địa điểm chưa có ảnh đúng tiếp tục để trống.
