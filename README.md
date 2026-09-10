# Bản đồ du lịch số Phường Bình Định — React/Vite v1.5

Dự án dùng **Vite + React + Tailwind CSS + Leaflet** và **Photo Sphere Viewer**, giao diện xanh dương/trắng, responsive và ưu tiên điện thoại.

## Chạy dự án

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm run preview
```

## Cập nhật chính v1.5

- **Báo cáo Excel nằm ngay trong trang Quản trị** dưới dạng tab `Báo cáo Excel`; không còn nút/route báo cáo tách rời trong giao diện.
- Ảnh 360° dùng **Photo Sphere Viewer** để dựng panorama dạng hình cầu: kéo xoay đủ 360°, nhìn lên/xuống, zoom và fullscreen. Ảnh 360° nên là equirectangular tỉ lệ 2:1.
- Dữ liệu ảnh minh họa mặc định được đa dạng hóa theo loại địa điểm; mỗi địa điểm có gallery để Admin có thể thay bằng ảnh thực tế riêng.
- Đánh giá có **luồng phản hồi**: Admin, tài khoản quản lý hoặc người dùng đã đăng nhập đều có thể trả lời đánh giá.
- Admin xem toàn bộ tài khoản đã đăng ký và có thể:
  - sửa tên đăng nhập, tên hiển thị, số điện thoại;
  - nâng/hạ vai trò `Người dùng` / `Quản lý nhóm`;
  - cấp quyền theo **Danh mục / Phân nhóm / Phân nhóm chi tiết**;
  - reset mật khẩu về `PhuongBinhDinh@123`;
  - bắt buộc người dùng đổi mật khẩu ở lần đăng nhập tiếp theo;
  - xóa tài khoản.
- Tài khoản `Quản lý nhóm` chỉ được thêm/sửa/xóa các địa điểm thuộc phạm vi Admin đã cấp.
- Đăng xuất **giữ nguyên trang hiện tại**. Ví dụ đang xem `/place.html?id=...` thì đăng xuất vẫn ở chính trang đó.
- Trang tài khoản người dùng có:
  - thay avatar từ máy;
  - sửa tên hiển thị và số điện thoại;
  - đổi mật khẩu;
  - lịch sử địa điểm đã xem / đã dẫn đường / đã đánh dấu đã đến;
  - đặt lịch nhắc cho địa điểm trong lịch sử;
  - bản đồ cá nhân hiển thị các địa điểm trong lịch sử và đánh dấu nơi đã đến.

## Chức năng hiện có

- Slideshow ảnh Trang chủ; card danh mục bấm được và mở đúng đầu trang danh mục.
- Bản đồ Leaflet, tìm kiếm, lọc, ranh giới phường, GPS, chọn vị trí và dẫn đường hoàn toàn trong website.
- Điểm xuất phát dẫn đường có thể ở **bất kỳ nơi nào tại Việt Nam**, không bị giới hạn trong Phường Bình Định.
- Khi dẫn đường, bản đồ chỉ hiển thị điểm đi, điểm đến và tuyến đường.
- Chi tiết địa điểm có nhiều ảnh, gallery, ảnh 360°, video ngắn, gọi điện, Zalo, website/Facebook/email, giờ mở cửa, tọa độ, nút Dẫn đường, đánh giá và phản hồi.
- Người dùng phải đăng nhập mới đánh giá; tài khoản đăng ký bắt buộc số điện thoại di động Việt Nam hợp lệ.
- Admin CRUD địa điểm, upload ảnh/gallery/ảnh 360°/video từ máy, quản lý slideshow, tài khoản, phân quyền, đánh giá, thống kê và báo cáo.
- Admin thêm/sửa địa điểm có options cho **Phân nhóm**, **Phân nhóm chi tiết**, **Từ khóa**; tọa độ có thể nhập tay, lấy GPS hoặc bấm trực tiếp trên bản đồ.
- Đã bỏ trường `Khu vực cũ` và `Plus Code` khỏi giao diện/dữ liệu mặc định.

## Báo cáo Excel

Vào `/admin` rồi chọn tab **Báo cáo Excel**. Có thể lọc:

- từ ngày giờ;
- đến ngày giờ;
- danh mục;
- loại báo cáo: đầy đủ, truy cập & lượt xem, dẫn đường, đánh giá, tài khoản hoặc danh mục địa điểm.

Nút **Xuất Excel danh mục** ở tab `Địa điểm` xuất danh sách đang tìm kiếm/lọc. Báo cáo sử dụng định dạng Excel XML `.xls`, mở trực tiếp bằng Microsoft Excel.

## Media tải từ máy

- Ảnh đại diện địa điểm: tối đa 8 MB/file.
- Gallery/ảnh 360°: tối đa 12 MB/file.
- Video ngắn: tối đa 40 MB/file.
- Slideshow trang chủ: tối đa 10 MB/file.
- Avatar tài khoản: tối đa 5 MB/file.

Media upload được lưu trong **IndexedDB** của trình duyệt. Dữ liệu nội dung, tài khoản, đánh giá, phân quyền, lịch sử, lịch nhắc và analytics hiện dùng localStorage.

## Dữ liệu hiện tại

- 170 địa điểm.
- 57 địa điểm có tọa độ GPS cố định.
- 17 cơ quan/đơn vị hành chính và dịch vụ công.
- Có `baba-tea` để tương thích `/place.html?id=baba-tea`.
- Không hiển thị nguồn dữ liệu, ngày rà soát, Khu vực cũ hoặc Plus Code trong chi tiết địa điểm.

## Tài khoản quản trị mặc định

```text
Tên đăng nhập: admin
Mật khẩu: BinhDinh@2026
```

Mật khẩu mặc định khi Admin reset tài khoản người dùng:

```text
PhuongBinhDinh@123
```

Sau khi đăng nhập bằng mật khẩu reset, hệ thống buộc người dùng đổi mật khẩu trước khi tiếp tục.

## Route chính

```text
/                       Bản đồ du lịch
/trang-chu              Trang chủ
/kham-pha-dia-diem      Khám phá địa điểm
/place.html?id=<id>     Chi tiết địa điểm
/dang-nhap              Đăng nhập
/dang-ky                Đăng ký
/doi-mat-khau           Đổi mật khẩu / bắt buộc đổi sau reset
/tai-khoan              Hồ sơ, avatar, lịch sử, lịch nhắc, bản đồ cá nhân
/admin                   Toàn bộ khu vực quản trị, gồm tab Báo cáo Excel
```

`/admin/bao-cao` chỉ còn redirect tương thích về `/admin`, không xuất hiện như một mục riêng trên giao diện.

## Lưu ý production

Bản này vẫn chạy độc lập không cần backend. Vì dữ liệu Admin, tài khoản, media, đánh giá, phân quyền, lịch sử, lịch nhắc và analytics được lưu **trên chính trình duyệt**, dữ liệu sẽ không tự đồng bộ giữa nhiều máy/điện thoại. Nếu triển khai thật cho nhiều người dùng, nên nối backend/database/object storage dùng chung và xác thực server-side.
