const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

/**
 * @openapi
 * /api/public/search/ai-smart:
 *   post:
 *     tags: [Public Search]
 *     summary: "Tìm kiếm thông minh bằng Gemini AI (Function Calling)"
 *     description: |
 *       Phân tích ý định tìm kiếm của người dùng bằng **Gemini Function Calling**.
 *       AI tự động xác định: đang tìm **sách** hay **tin tức**, trích xuất tiêu chí lọc
 *       (tác giả, năm xuất bản, thể loại, loại media...) và thực thi tìm kiếm chính xác.
 *
 *       **Ưu điểm so với tìm kiếm cơ bản:**
 *       - Hiểu câu hỏi tự nhiên: *"sách Python cho người mới bắt đầu xuất bản sau 2020"*
 *       - Tự phân biệt sách vs tin tức
 *       - Trả về `ai_interpreted` để App hiển thị rõ AI đã hiểu gì
 *       - Fallback an toàn nếu AI timeout
 *
 *       **Lưu ý:** Response `data.type = "books" | "news"` để App biết render component nào.
 *
 *       **Ví dụ test nhanh:**
 *       - Query tự nhiên: `"sách lập trình python cho người mới"`
 *       - Query có nhiễu meta: `"Trích xuất từ khóa tìm kiếm chính xác: về lập trình tôi"`
 *         → Backend sẽ tự chuẩn hóa query và sanitize params trước khi tìm kiếm.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "tìm sách lập trình Python xuất bản sau năm 2020"
 *                 description: "Câu hỏi tự nhiên của người dùng (tối thiểu 2 ký tự)"
 *               pageIndex:
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *               pageSize:
 *                 type: integer
 *                 default: 10
 *                 example: 10
 *           examples:
 *             natural_query:
 *               summary: Query tự nhiên
 *               value:
 *                 query: "sách lập trình python cho người mới"
 *                 pageIndex: 1
 *                 pageSize: 10
 *             noisy_meta_query:
 *               summary: Query có chỉ dẫn meta (backend sẽ làm sạch)
 *               value:
 *                 query: "Trích xuất từ khóa tìm kiếm chính xác: về lập trình tôi"
 *                 pageIndex: 1
 *                 pageSize: 10
 *     responses:
 *       200:
 *         description: "Tìm kiếm thành công"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [books, news]
 *                           description: "Loại kết quả AI trả về"
 *                         items:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Publication' }
 *                         totalRecords:
 *                           type: integer
 *                           example: 12
 *                         totalPages:
 *                           type: integer
 *                           example: 2
 *                         pageIndex:
 *                           type: integer
 *                           example: 1
 *                         pageSize:
 *                           type: integer
 *                           example: 10
 *                         ai_interpreted:
 *                           type: object
 *                           nullable: true
 *                           description: "Thông tin AI đã phân tích được (null nếu fallback)"
 *                           properties:
 *                             function:
 *                               type: string
 *                               enum: [searchBooks, searchNews]
 *                             params:
 *                               type: object
 *                               description: "Tham số đã được backend sanitize trước khi search"
 *                             originalQuery:
 *                               type: string
 *                               description: "Query đã được normalize và dùng để phân tích"
 *                             rawQuery:
 *                               type: string
 *                               description: "Query gốc từ client trước khi normalize"
 *                             strategy:
 *                               type: object
 *                               description: "Pipeline xử lý để debug và đánh giá chất lượng"
 *                               properties:
 *                                 mode:
 *                                   type: string
 *                                   example: function-calling+rerank
 *                                 stages:
 *                                   type: array
 *                                   items: { type: string }
 *                                   example: [normalize-query, function-call, sanitize-args, hybrid-retrieve, intent-rerank]
 *             examples:
 *               books_result:
 *                 summary: Kết quả books với ai_interpreted đầy đủ
 *                 value:
 *                   code: 0
 *                   success: true
 *                   message: "Tìm kiếm thông minh thành công"
 *                   data:
 *                     type: books
 *                     items: []
 *                     totalRecords: 5
 *                     totalPages: 1
 *                     pageIndex: 1
 *                     pageSize: 10
 *                     ai_interpreted:
 *                       function: searchBooks
 *                       params:
 *                         keywords: ["lập trình"]
 *                         limit: 10
 *                       originalQuery: "về lập trình tôi"
 *                       rawQuery: "Trích xuất từ khóa tìm kiếm chính xác: về lập trình tôi"
 *                       strategy:
 *                         mode: function-calling+rerank
 *                         stages: [normalize-query, function-call, sanitize-args, hybrid-retrieve, intent-rerank]
 *                   errorId: null
 *                   appId: null
 *                   errors: null
 *       500:
 *         description: "Lỗi hệ thống"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/ai-smart', searchController.aiSmartSearch);

/**
 * @openapi
 * /api/public/search/ai-news-suggest:
 *   get:
 *     tags: [Public Search]
 *     summary: "Gợi ý tin tức theo từ khóa (News tab)"
 *     description: |
 *       API chuyên dụng cho tab Tin tức trên App.
 *       Trả về trực tiếp danh sách bài viết đã xuất bản theo từ khóa tìm kiếm.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema: { type: string, minLength: 2 }
 *         description: "Từ khóa tìm tin tức"
 *         example: "lập trình"
 *       - in: query
 *         name: pageIndex
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200:
 *         description: "Danh sách gợi ý tin tức"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SearchNewsResponse'
 */
router.get('/ai-news-suggest', searchController.aiNewsSuggest);

/**
 * @openapi
 * /api/public/search/autocomplete:
 *   get:
 *     tags: [Public Search]
 *     summary: "Gợi ý tìm kiếm nhanh (Autocomplete)"
 *     description: |
 *       Trả về danh sách gợi ý khi người dùng đang gõ (tìm thẳng trong DB, không qua AI).
 *       Tốc độ nhanh (~50ms), phù hợp để gọi real-time khi người dùng gõ từng ký tự.
 *
 *       **Gợi ý:** Gọi API này sau khi người dùng gõ ≥ 2 ký tự với debounce 300ms.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, minLength: 2 }
 *         description: "Từ khóa đang gõ (tối thiểu 2 ký tự)"
 *         example: "python"
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8, maximum: 20 }
 *         description: "Số lượng gợi ý tối đa"
 *     responses:
 *       200:
 *         description: "Danh sách gợi ý"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/SearchAutocompleteItem' }
 */
router.get('/autocomplete', searchController.autocomplete);

/**
 * @openapi
 * /api/public/search/publications:
 *   get:
 *     tags: [Public Search]
 *     summary: "Tra cứu ấn phẩm (Cơ bản & Nâng cao)"
 *     description: |
 *       Tìm kiếm ấn phẩm theo nhiều tiêu chí. Phục vụ màn hình **Tra cứu tài liệu** trên Mobile App.
 *
 *       - **Tìm cơ bản**: Dùng `search` để tìm trong nhan đề, tác giả, ISBN, mã
 *       - **Tìm nâng cao**: Kết hợp `title`, `author`, `year_from`, `year_to`
 *       - **Lọc theo năm**: Dùng `year` (1 năm) hoặc `years` (nhiều năm cách nhau dấu phẩy)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Từ khóa chung (tìm trong nhan đề, tác giả, mã, ISBN)"
 *       - in: query
 *         name: title
 *         schema: { type: string }
 *         description: "Lọc chính xác theo nhan đề"
 *       - in: query
 *         name: author
 *         schema: { type: string }
 *         description: "Lọc chính xác theo tác giả"
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: "Lọc đúng 1 năm xuất bản"
 *       - in: query
 *         name: years
 *         schema: { type: string }
 *         description: "Lọc nhiều năm rời rạc, ngăn cách bằng dấu phẩy. VD: 2020,2022,2024"
 *       - in: query
 *         name: year_from
 *         schema: { type: integer, default: 2005 }
 *         description: "Xuất bản từ năm"
 *       - in: query
 *         name: year_to
 *         schema: { type: integer }
 *         description: "Xuất bản đến năm"
 *       - in: query
 *         name: media_type
 *         schema: { type: string, enum: [Physical, Digital, Hybrid] }
 *         description: "Loại ấn phẩm"
 *       - in: query
 *         name: collection
 *         schema: { type: string }
 *         description: "Lọc theo bộ sưu tập (nhận ID hoặc tên collection)"
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [default, views, favorites, title, year] }
 *         default: default
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Danh sách ấn phẩm khớp điều kiện"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SearchPublicationsResponse'
 */
router.get('/publications', searchController.searchPublications);

/**
 * @openapi
 * /api/public/search/barcode/{barcode}:
 *   get:
 *     tags: [Public Search]
 *     summary: "Quét mã Barcode/QR để tra cứu ấn phẩm"
 *     description: |
 *       Tra cứu ấn phẩm bằng mã vạch (barcode) hoặc mã QR.
 *       Phục vụ tính năng **Quét mã** trên Mobile App.
 *       Khi tìm thấy sẽ trả về thông tin chi tiết đầy đủ để hiển thị ngay màn hình Detail.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema: { type: string }
 *         description: "Mã vạch hoặc chuỗi QR code của ấn phẩm"
 *         example: "BC-001-20240101"
 *     responses:
 *       200:
 *         description: "Thông tin chi tiết ấn phẩm"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Publication' }
 *       404:
 *         description: "Mã vạch không tồn tại"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/barcode/:barcode', searchController.searchByBarcode);

module.exports = router;
