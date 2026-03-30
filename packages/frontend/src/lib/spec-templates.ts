export interface SpecField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "textarea";
  unit?: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  group?: string;
}

export type ProductType = "gach" | "tbvs" | "bep" | "phu-tro";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  gach: "🪨 Gạch ốp lát",
  tbvs: "🚿 Thiết bị vệ sinh",
  bep: "🍳 Thiết bị bếp",
  "phu-tro": "🧴 Vật liệu phụ trợ",
};

const GACH_FIELDS: SpecField[] = [
  {
    key: "size",
    label: "Kích thước",
    type: "select",
    required: true,
    group: "Kích thước & Quy cách",
    options: [
      "30x30",
      "40x40",
      "45x45",
      "50x50",
      "60x60",
      "80x80",
      "100x100",
      "30x60",
      "40x80",
      "60x120",
      "80x160",
      "20x100",
      "20x120",
      "30x120",
      "Tùy chỉnh",
    ],
  },
  {
    key: "size_custom",
    label: "Kích thước tùy chỉnh",
    type: "text",
    unit: "cm",
    placeholder: "VD: 75x150",
    group: "Kích thước & Quy cách",
  },
  {
    key: "thickness_mm",
    label: "Độ dày",
    type: "number",
    unit: "mm",
    placeholder: "VD: 9",
    group: "Kích thước & Quy cách",
  },
  {
    key: "material",
    label: "Chất liệu xương gạch",
    type: "select",
    required: true,
    group: "Chất liệu",
    options: [
      "Porcelain (Đá đồng chất)",
      "Ceramic (Đất nung)",
      "Granite",
      "Nano",
      "Full Body Porcelain",
    ],
  },
  {
    key: "surface_finish",
    label: "Bề mặt hoàn thiện",
    type: "select",
    required: true,
    group: "Chất liệu",
    options: [
      "Bóng kính (Polish)",
      "Mờ (Matte)",
      "Lappato (Bán bóng)",
      "Chống trơn (Anti-slip)",
      "Giả đá tự nhiên",
      "Giả gỗ",
    ],
  },
  {
    key: "color",
    label: "Màu sắc / Tông màu",
    type: "text",
    placeholder: "VD: Trắng vân đá, Xám tro",
    group: "Màu sắc",
  },
  {
    key: "pattern",
    label: "Vân / Họa tiết",
    type: "text",
    placeholder: "VD: Vân đá marble, Vân gỗ sồi",
    group: "Màu sắc",
  },
  {
    key: "pieces_per_box",
    label: "Số viên / thùng",
    type: "number",
    required: true,
    placeholder: "VD: 4",
    group: "Quy cách đóng gói",
  },
  {
    key: "m2_per_box",
    label: "Diện tích / thùng",
    type: "number",
    unit: "m²",
    placeholder: "VD: 1.44",
    group: "Quy cách đóng gói",
  },
  {
    key: "kg_per_box",
    label: "Trọng lượng / thùng",
    type: "number",
    unit: "kg",
    placeholder: "VD: 38",
    group: "Quy cách đóng gói",
  },
  {
    key: "slip_resistance",
    label: "Chống trơn trượt",
    type: "select",
    group: "Kỹ thuật",
    options: ["R9", "R10", "R11", "R12", "Không áp dụng"],
  },
  {
    key: "water_absorption",
    label: "Độ hút nước",
    type: "number",
    unit: "%",
    placeholder: "VD: 0.1",
    group: "Kỹ thuật",
  },
  {
    key: "wear_resistance",
    label: "Độ mài mòn (PEI)",
    type: "select",
    group: "Kỹ thuật",
    options: ["PEI I", "PEI II", "PEI III", "PEI IV", "PEI V"],
  },
  {
    key: "style",
    label: "Phong cách phối cảnh",
    type: "text",
    placeholder: "VD: Hiện đại, Tối giản, Cổ điển",
    group: "Ứng dụng",
  },
  {
    key: "pairing",
    label: "Gợi ý phối cảnh",
    type: "textarea",
    placeholder: "VD: Phù hợp phòng khách...",
    group: "Ứng dụng",
  },
  {
    key: "origin",
    label: "Xuất xứ",
    type: "select",
    group: "Xuất xứ",
    options: [
      "Việt Nam",
      "Ý",
      "Tây Ban Nha",
      "Trung Quốc",
      "Ấn Độ",
      "Malaysia",
      "Indonesia",
      "Thái Lan",
    ],
  },
  {
    key: "brand",
    label: "Thương hiệu",
    type: "text",
    placeholder: "VD: Tilers, Viglacera, Đồng Tâm",
    group: "Xuất xứ",
  },
];

const TBVS_FIELDS: SpecField[] = [
  {
    key: "drain_center",
    label: "Tâm xả (bồn cầu)",
    type: "select",
    group: "Thông số lắp đặt",
    options: ["200mm", "250mm", "300mm", "305mm", "400mm", "Không áp dụng"],
  },
  {
    key: "water_pressure_min",
    label: "Áp lực nước tối thiểu",
    type: "number",
    unit: "bar",
    placeholder: "VD: 0.5",
    group: "Thông số lắp đặt",
  },
  {
    key: "pipe_inlet_diameter",
    label: "Đường kính ống cấp nước",
    type: "text",
    placeholder: "VD: DN15 (1/2 inch)",
    group: "Thông số lắp đặt",
  },
  {
    key: "pipe_drain_diameter",
    label: "Đường kính ống thoát nước",
    type: "text",
    placeholder: "VD: DN110",
    group: "Thông số lắp đặt",
  },
  {
    key: "install_type",
    label: "Kiểu lắp đặt",
    type: "select",
    group: "Thông số lắp đặt",
    options: [
      "Đặt sàn",
      "Treo tường",
      "Âm tường",
      "Âm sàn",
      "Gắn bàn",
      "Đặt bàn",
    ],
  },
  {
    key: "size",
    label: "Kích thước tổng thể (D×R×C)",
    type: "text",
    placeholder: "VD: 680×360×780mm",
    group: "Kích thước",
  },
  {
    key: "rough_in",
    label: "Khoảng cách lắp đặt (Rough-in)",
    type: "text",
    placeholder: "VD: 300mm",
    group: "Kích thước",
  },
  {
    key: "flush_volume",
    label: "Lượng nước xả",
    type: "select",
    group: "Công năng",
    options: [
      "3.0L",
      "4.5L",
      "6.0L",
      "3.0L/4.5L (dual flush)",
      "4.5L/6.0L (dual flush)",
      "6.0L/9.0L (dual flush)",
    ],
  },
  {
    key: "flush_type",
    label: "Chế độ xả",
    type: "select",
    group: "Công năng",
    options: [
      "Xả nhấn (push button)",
      "Xả gạt (lever)",
      "Xả cảm ứng",
      "Xả giật dây",
      "Xả điện tử",
    ],
  },
  {
    key: "water_saving",
    label: "Tiết kiệm nước",
    type: "select",
    group: "Công năng",
    options: [
      "Có (dual flush)",
      "Không",
      "WELS 4 sao",
      "WELS 5 sao",
      "WELS 6 sao",
    ],
  },
  {
    key: "material",
    label: "Chất liệu lõi",
    type: "select",
    required: true,
    group: "Chất liệu & Công nghệ",
    options: [
      "Sứ cao cấp (Vitreous China)",
      "Đồng thau nguyên chất",
      "Inox 304",
      "Inox 316",
      "Acrylic",
      "Nhựa ABS cao cấp",
      "Đá nhân tạo (Solid Surface)",
    ],
  },
  {
    key: "surface_coating",
    label: "Công nghệ men / Bề mặt",
    type: "select",
    group: "Chất liệu & Công nghệ",
    options: [
      "Men Nano chống bám bẩn",
      "Men kháng khuẩn",
      "Mạ Chrome",
      "Mạ PVD (bền màu)",
      "Sơn tĩnh điện",
      "Không phủ",
    ],
  },
  {
    key: "color",
    label: "Màu sắc",
    type: "text",
    placeholder: "VD: Trắng bóng, Đen mờ, Vàng đồng",
    group: "Chất liệu & Công nghệ",
  },
  {
    key: "tech_features",
    label: "Tính năng công nghệ",
    type: "text",
    placeholder: "VD: Tự làm sạch, Khử mùi, Sưởi ấm bệ ngồi",
    group: "Tính năng",
  },
  {
    key: "certifications",
    label: "Chứng nhận / Tiêu chuẩn",
    type: "text",
    placeholder: "VD: TCVN, ISO 9001, WELS",
    group: "Tính năng",
  },
  {
    key: "brand",
    label: "Thương hiệu",
    type: "text",
    placeholder: "VD: TOTO, Inax, American Standard, Viglacera",
    group: "Xuất xứ & Bảo hành",
  },
  {
    key: "origin",
    label: "Xuất xứ",
    type: "select",
    group: "Xuất xứ & Bảo hành",
    options: [
      "Việt Nam",
      "Nhật Bản",
      "Hàn Quốc",
      "Đức",
      "Ý",
      "Trung Quốc",
      "Thái Lan",
      "Malaysia",
    ],
  },
  {
    key: "warranty",
    label: "Bảo hành",
    type: "text",
    placeholder: "VD: Bảo hành chính hãng 5 năm tại nhà",
    group: "Xuất xứ & Bảo hành",
  },
];

const BEP_FIELDS: SpecField[] = [
  {
    key: "size_overall",
    label: "Kích thước phủ bì (D×R×C)",
    type: "text",
    required: true,
    placeholder: "VD: 700×510×145mm",
    group: "Kích thước",
  },
  {
    key: "size_cutout",
    label: "Kích thước khoét đá / lắp âm",
    type: "text",
    required: true,
    placeholder: "VD: 670×480mm",
    group: "Kích thước",
  },
  {
    key: "size_panel",
    label: "Kích thước mặt bếp",
    type: "text",
    placeholder: "VD: 700×510mm",
    group: "Kích thước",
  },
  {
    key: "power_total",
    label: "Tổng công suất",
    type: "number",
    unit: "W",
    required: true,
    placeholder: "VD: 7200",
    group: "Thông số điện",
  },
  {
    key: "voltage",
    label: "Điện áp",
    type: "select",
    group: "Thông số điện",
    options: ["220V / 50Hz", "380V / 50Hz", "220-240V / 50-60Hz"],
  },
  {
    key: "burner_count",
    label: "Số vùng nấu / mâm chia lửa",
    type: "number",
    placeholder: "VD: 2",
    group: "Thông số điện",
  },
  {
    key: "burner_type",
    label: "Loại bếp",
    type: "select",
    group: "Thông số điện",
    options: [
      "Bếp từ (Induction)",
      "Bếp hồng ngoại",
      "Bếp gas âm",
      "Bếp gas dương",
      "Bếp đôi (gas + từ)",
      "Bếp điện từ",
    ],
  },
  {
    key: "power_zones",
    label: "Công suất từng vùng nấu",
    type: "text",
    placeholder: "VD: 2000W + 2800W + 2400W",
    group: "Thông số điện",
  },
  {
    key: "surface_material",
    label: "Chất liệu mặt bếp",
    type: "select",
    required: true,
    group: "Chất liệu",
    options: [
      "Kính Schott Ceran (Đức)",
      "Kính Ceramic",
      "Kính cường lực",
      "Inox 304",
      "Gang đúc",
      "Nhôm đúc",
    ],
  },
  {
    key: "body_material",
    label: "Chất liệu thân bếp",
    type: "select",
    group: "Chất liệu",
    options: ["Inox 304", "Inox 430", "Nhôm đúc", "Thép sơn tĩnh điện"],
  },
  {
    key: "color",
    label: "Màu sắc",
    type: "text",
    placeholder: "VD: Đen, Bạc, Trắng",
    group: "Chất liệu",
  },
  {
    key: "safety_child_lock",
    label: "Khóa trẻ em",
    type: "select",
    group: "Tính năng an toàn",
    options: ["Có", "Không"],
  },
  {
    key: "safety_overflow",
    label: "Tự ngắt khi trào nước",
    type: "select",
    group: "Tính năng an toàn",
    options: ["Có", "Không"],
  },
  {
    key: "safety_residual_heat",
    label: "Cảnh báo nhiệt dư",
    type: "select",
    group: "Tính năng an toàn",
    options: ["Có", "Không"],
  },
  {
    key: "safety_auto_off",
    label: "Tự tắt khi không dùng",
    type: "select",
    group: "Tính năng an toàn",
    options: ["Có", "Không"],
  },
  {
    key: "safety_gas_cut",
    label: "Tự ngắt gas khi tắt lửa",
    type: "select",
    group: "Tính năng an toàn",
    options: ["Có", "Không", "Không áp dụng"],
  },
  {
    key: "control_type",
    label: "Kiểu điều khiển",
    type: "select",
    group: "Tính năng",
    options: [
      "Núm xoay",
      "Cảm ứng",
      "Cảm ứng + Núm xoay",
      "Điều khiển giọng nói",
      "Kết nối WiFi/App",
    ],
  },
  {
    key: "boost_mode",
    label: "Chế độ Boost / Turbo",
    type: "select",
    group: "Tính năng",
    options: ["Có", "Không"],
  },
  {
    key: "timer",
    label: "Hẹn giờ",
    type: "select",
    group: "Tính năng",
    options: ["Có", "Không"],
  },
  {
    key: "inverter",
    label: "Công nghệ Inverter",
    type: "select",
    group: "Tính năng",
    options: ["Có", "Không"],
  },
  {
    key: "brand",
    label: "Thương hiệu",
    type: "text",
    placeholder: "VD: Bosch, Electrolux, Sunhouse, Teka",
    group: "Xuất xứ & Bảo hành",
  },
  {
    key: "origin",
    label: "Xuất xứ",
    type: "select",
    group: "Xuất xứ & Bảo hành",
    options: [
      "Việt Nam",
      "Đức",
      "Ý",
      "Tây Ban Nha",
      "Hàn Quốc",
      "Nhật Bản",
      "Trung Quốc",
      "Thái Lan",
    ],
  },
  {
    key: "warranty",
    label: "Bảo hành",
    type: "text",
    placeholder: "VD: Bảo hành chính hãng 3 năm tại nhà",
    group: "Xuất xứ & Bảo hành",
  },
  {
    key: "stock_status",
    label: "Tình trạng kho",
    type: "select",
    required: true,
    group: "Kho",
    options: ["in_stock", "pre_order", "coming_soon", "out_of_stock"],
  },
  {
    key: "warehouse_location",
    label: "Vị trí trong kho",
    type: "text",
    placeholder: "VD: Kệ A3, Hàng 2",
    group: "Nội bộ",
  },
  {
    key: "supplier_name",
    label: "Tên nhà cung cấp",
    type: "text",
    placeholder: "VD: Công ty TNHH ABC",
    group: "Nội bộ",
  },
  {
    key: "supplier_phone",
    label: "SĐT nhà cung cấp",
    type: "text",
    placeholder: "VD: 0901234567",
    group: "Nội bộ",
  },
];

const PHU_TRO_FIELDS: SpecField[] = [
  { key: "composition", label: "Thành phần", type: "text", group: "Thông số" },
  {
    key: "packaging",
    label: "Đóng gói",
    type: "text",
    placeholder: "VD: Túi 25kg",
    group: "Thông số",
  },
  {
    key: "setting_time",
    label: "Thời gian đông cứng",
    type: "text",
    placeholder: "VD: 24 giờ",
    group: "Thông số",
  },
  {
    key: "coverage",
    label: "Định mức thi công",
    type: "text",
    placeholder: "VD: 4-5 kg/m²",
    group: "Thông số",
  },
  { key: "origin", label: "Xuất xứ", type: "text", group: "Xuất xứ" },
  { key: "brand", label: "Thương hiệu", type: "text", group: "Xuất xứ" },
  {
    key: "warranty",
    label: "Hạn sử dụng",
    type: "text",
    placeholder: "VD: 12 tháng kể từ ngày sản xuất",
    group: "Xuất xứ",
  },
];

export const SPEC_TEMPLATES: Record<ProductType, SpecField[]> = {
  gach: GACH_FIELDS,
  tbvs: TBVS_FIELDS,
  bep: BEP_FIELDS,
  "phu-tro": PHU_TRO_FIELDS,
};

export function detectProductType(categorySlug: string): ProductType {
  const slug = (categorySlug ?? "").toLowerCase();
  if (
    slug.includes("gach") ||
    slug.includes("op-lat") ||
    slug.includes("lat-nen")
  )
    return "gach";
  if (
    slug.includes("ve-sinh") ||
    slug.includes("bon-cau") ||
    slug.includes("lavabo") ||
    slug.includes("sen-tam")
  )
    return "tbvs";
  if (
    slug.includes("bep") ||
    slug.includes("lo-nuong") ||
    slug.includes("may-hut")
  )
    return "bep";
  if (slug.includes("phu-tro") || slug.includes("keo") || slug.includes("ron"))
    return "phu-tro";
  return "gach";
}

export function getSpecTemplate(categorySlugOrType: string): SpecField[] {
  if (categorySlugOrType in SPEC_TEMPLATES) {
    return SPEC_TEMPLATES[categorySlugOrType as ProductType];
  }
  return SPEC_TEMPLATES[detectProductType(categorySlugOrType)];
}

export function mergeSpecs(
  template: Record<string, any>,
  custom: Record<string, any>,
): Record<string, any> {
  return { ...template, ...custom };
}

export const STOCK_STATUS_LABELS: Record<string, string> = {
  in_stock: "Còn hàng",
  pre_order: "Cần đặt trước",
  coming_soon: "Sắp về",
  out_of_stock: "Hết hàng",
};
