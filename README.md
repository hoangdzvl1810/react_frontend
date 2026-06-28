# React Frontend

Dự án sử dụng Create React App với `react-scripts`.

## Chạy dự án

```bash
npm install
npm start
```

Ứng dụng chạy mặc định tại `http://localhost:3000`.

Chạy JSON Server trong một terminal khác:

```bash
npm run server
```

API giả lập chạy tại `http://localhost:3001`.

Trước khi chạy hoặc build, dữ liệu trong `db.json` được tự động đồng bộ vào
`src/data/db.json` để ứng dụng vẫn có dữ liệu dự phòng khi JSON Server chưa chạy.

## Các lệnh chính

- `npm start` hoặc `npm run dev`: chạy môi trường phát triển.
- `npm run build`: tạo production build trong thư mục `build`.
- `npm test`: chạy test ở chế độ theo dõi.
- `npm run lint`: kiểm tra mã nguồn bằng ESLint của Create React App.
