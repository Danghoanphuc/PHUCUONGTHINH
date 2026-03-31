"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown } from "lucide-react";
import { useAuth } from "@repo/shared-utils";

type ProductType = "gach" | "tbvs" | "bep" | "phu-tro";

function val(specs: Record<string, any>, ...keys: string[]): any {
  for (const k of keys) {
    if (specs[k] !== undefined && specs[k] !== null && specs[k] !== "")
      return specs[k];
  }
  return null;
}

function fmt(v: any): string | null {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v))
    return v
      .map((i) => fmt(i))
      .filter(Boolean)
      .join(", ");
  if (typeof v === "object")
    return Object.values(v)
      .filter((x) => x !== null && x !== undefined)
      .join(" x ");
  return String(v);
}

function detectType(specs: Record<string, any>): ProductType {
  const t = specs["product_type"];
  if (t === "tbvs" || t === "bep" || t === "phu-tro") return t;
  if (specs["drain_center"] || specs["flush_volume"] || specs["flush_type"])
    return "tbvs";
  if (specs["size_cutout"] || specs["burner_count"] || specs["power_total"])
    return "bep";
  return "gach";
}

// ── QuickCalc ─────────────────────────────────────────────────────────────────
function QuickCalc({
  piecesPerBox,
  m2PerBox,
}: {
  piecesPerBox: number;
  m2PerBox: number;
}) {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState("");
  const boxes = area ? Math.ceil((Number(area) * 1.1) / m2PerBox) : null;
  const pieces = boxes !== null ? boxes * piecesPerBox : null;
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 transition-colors"
      >
        🧮 Tính số lượng
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">
              🧮 Tính nhanh số lượng cần mua
            </p>
            <input
              type="number"
              min="1"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Diện tích (m²)"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {boxes !== null && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between"
              >
                <div>
                  <p className="text-xl font-black text-blue-700">
                    {boxes} thùng
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {pieces} viên · +10% hao hụt
                  </p>
                </div>
                <div className="text-3xl">📦</div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── QR Code ───────────────────────────────────────────────────────────────────
export function QRSection({
  sku,
  productUrl,
}: {
  sku: string;
  productUrl: string;
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=${encodeURIComponent(productUrl)}`;
  const qrDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(productUrl)}`;
  return (
    <div className="flex flex-col items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt={`QR code ${sku}`}
        width={56}
        height={56}
        className="rounded-lg border border-gray-200"
      />
      <a
        href={qrDownloadUrl}
        download={`qr-${sku}.png`}
        title="Tải QR về máy"
        className="text-gray-400 hover:text-primary transition-colors"
      >
        <Download size={14} />
      </a>
    </div>
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────

/** Stat nổi bật — dùng cho thông số chính */
function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 flex flex-col gap-0.5 ${accent ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-100"}`}
    >
      <span
        className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${accent ? "text-emerald-600" : "text-gray-400"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm sm:text-base font-black leading-tight ${accent ? "text-emerald-800" : "text-gray-900"}`}
      >
        {value}
      </span>
      {sub && (
        <span
          className={`text-[9px] sm:text-[10px] ${accent ? "text-emerald-500" : "text-gray-400"}`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

/** Row dạng 2 cột nhỏ gọn */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-full sm:w-[45%] text-[10px] sm:text-xs text-gray-400 shrink-0 leading-relaxed">
        {label}
      </span>
      <span className="flex-1 text-[10px] sm:text-xs font-semibold text-gray-800 leading-relaxed">
        {value}
      </span>
    </div>
  );
}

/** Badge pill */
function Badge({
  icon,
  label,
  color = "gray",
}: {
  icon: string;
  label: string;
  color?: "blue" | "green" | "amber" | "gray";
}) {
  const cls = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    gray: "bg-gray-50 border-gray-200 text-gray-600",
  }[color];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cls}`}
    >
      {icon} {label}
    </span>
  );
}

/** Section có thể collapse */
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-lg sm:rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2.5 sm:px-3 md:px-3.5 py-2 sm:py-2.5 bg-gray-50/80 hover:bg-gray-100/60 transition-colors"
      >
        <span className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">
          {title}
        </span>
        <ChevronDown
          size={12}
          className={`text-gray-400 transition-transform duration-200 sm:w-[14px] sm:h-[14px] ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Gạch specs ────────────────────────────────────────────────────────────────
function GachSpecs({ specs }: { specs: Record<string, any> }) {
  const { isAuthenticated } = useAuth();
  const size = val(specs, "size", "kich_thuoc");
  const thickness = val(specs, "thickness_mm", "do_day");
  const piecesPerBox = Number(
    val(specs, "pieces_per_box", "vien_per_thung") ?? 0,
  );
  const m2PerBox = Number(val(specs, "m2_per_box", "box_coverage") ?? 0);
  const kgPerBox = val(specs, "kg_per_box");
  const faces = val(specs, "faces", "num_faces");
  const color = val(specs, "color", "mau_sac");
  const pattern = val(specs, "pattern", "van");
  const material = val(specs, "material", "body_type");
  const surface = val(specs, "surface_finish", "finish", "surface");
  const brand = val(specs, "brand");
  const origin = val(specs, "origin", "xuat_xu");
  const pairing = val(specs, "pairing", "phoi_canh", "suitable_for");
  const style = val(specs, "style", "phong_cach");
  const priceM2 = Number(
    val(specs, "price_m2", "gia_m2", "price_retail", "price") ?? 0,
  );
  const priceBox =
    priceM2 > 0 && m2PerBox > 0
      ? priceM2 * m2PerBox
      : Number(val(specs, "price_box", "gia_thung") ?? 0);
  const fmtPrice = (v: number) =>
    new Intl.NumberFormat("vi-VN").format(v) + "đ";

  return (
    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
      {/* Thông số chính — grid nổi bật */}
      {(size || thickness || piecesPerBox > 0 || m2PerBox > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
          {size && <StatCard label="Kích thước" value={`${size} cm`} accent />}
          {thickness && <StatCard label="Độ dày" value={`${thickness} mm`} />}
          {piecesPerBox > 0 && (
            <StatCard label="Số viên / thùng" value={`${piecesPerBox} viên`} />
          )}
          {m2PerBox > 0 && (
            <StatCard label="Diện tích / thùng" value={`${m2PerBox} m²`} />
          )}
          {kgPerBox && (
            <StatCard label="Trọng lượng / thùng" value={`${kgPerBox} kg`} />
          )}
          {faces && <StatCard label="Số mặt vân" value={`${faces} faces`} />}
        </div>
      )}

      {/* Tính số lượng */}
      {piecesPerBox > 0 && m2PerBox > 0 && (
        <QuickCalc piecesPerBox={piecesPerBox} m2PerBox={m2PerBox} />
      )}

      {/* Màu sắc & Chất liệu */}
      {(color || pattern || material || surface) && (
        <Section title="Chất liệu & Bề mặt">
          {color && <Row label="Màu sắc" value={fmt(color)!} />}
          {pattern && <Row label="Vân / Họa tiết" value={fmt(pattern)!} />}
          {material && <Row label="Xương gạch" value={fmt(material)!} />}
          {surface && <Row label="Bề mặt" value={fmt(surface)!} />}
        </Section>
      )}

      {/* Xuất xứ */}
      {(brand || origin) && (
        <Section title="Thương hiệu & Xuất xứ" defaultOpen={false}>
          {brand && <Row label="Thương hiệu" value={fmt(brand)!} />}
          {origin && <Row label="Xuất xứ" value={fmt(origin)!} />}
        </Section>
      )}

      {/* Phối cảnh */}
      {(style || pairing) && (
        <Section title="Phong cách & Gợi ý phối" defaultOpen={false}>
          {style && <Row label="Phong cách" value={fmt(style)!} />}
          {pairing && (
            <p className="text-xs text-gray-600 leading-relaxed pt-1">
              {fmt(pairing)}
            </p>
          )}
        </Section>
      )}

      {/* Giá — chỉ admin */}
      {priceM2 > 0 && isAuthenticated && (
        <div className="rounded-xl overflow-hidden border border-amber-200">
          <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Giá thành
            </span>
          </div>
          <div className="px-3.5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Giá / m²</p>
              <p className="text-lg font-black text-gray-900">
                {fmtPrice(priceM2)}
              </p>
            </div>
            {priceBox > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">
                  Giá / thùng {m2PerBox > 0 && `(${m2PerBox}m²)`}
                </p>
                <p className="text-lg font-black text-gray-900">
                  {fmtPrice(priceBox)}
                </p>
              </div>
            )}
          </div>
          <p className="px-3.5 pb-2 text-[10px] text-gray-400">
            * Giá tham khảo, chưa bao gồm VAT và phí vận chuyển
          </p>
        </div>
      )}
    </div>
  );
}

// ── TBVS specs ────────────────────────────────────────────────────────────────
function TBVSSpecs({ specs }: { specs: Record<string, any> }) {
  const { isAuthenticated } = useAuth();
  const drainCenter = val(specs, "drain_center");
  const waterPressure = val(specs, "water_pressure_min");
  const pipeInlet = val(specs, "pipe_inlet_diameter");
  const pipeDrain = val(specs, "pipe_drain_diameter");
  const installType = val(specs, "install_type");
  const size = val(specs, "size", "size_overall");
  const roughIn = val(specs, "rough_in");
  const flushVolume = val(specs, "flush_volume");
  const flushType = val(specs, "flush_type");
  const waterSaving = val(specs, "water_saving");
  const material = val(specs, "material");
  const surfaceCoating = val(specs, "surface_coating");
  const color = val(specs, "color");
  const techFeatures = val(specs, "tech_features");
  const certifications = val(specs, "certifications");
  const brand = val(specs, "brand");
  const origin = val(specs, "origin");
  const warranty = val(specs, "warranty");
  const priceRetail = Number(
    val(specs, "price_retail", "price_m2", "price") ?? 0,
  );
  const fmtPrice = (v: number) =>
    new Intl.NumberFormat("vi-VN").format(v) + "đ";

  return (
    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
      {/* Thông số chính */}
      {(drainCenter || size || installType) && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
          {drainCenter && (
            <StatCard label="Tâm xả" value={fmt(drainCenter)!} accent />
          )}
          {size && <StatCard label="Kích thước" value={fmt(size)!} />}
          {installType && (
            <StatCard label="Kiểu lắp" value={fmt(installType)!} />
          )}
          {roughIn && (
            <StatCard label="Khoảng cách lắp" value={fmt(roughIn)!} />
          )}
        </div>
      )}

      {(waterPressure || pipeInlet || pipeDrain) && (
        <Section title="Thông số lắp đặt">
          {waterPressure && (
            <Row label="Áp lực nước tối thiểu" value={`${waterPressure} bar`} />
          )}
          {pipeInlet && <Row label="Ống cấp nước" value={fmt(pipeInlet)!} />}
          {pipeDrain && <Row label="Ống thoát nước" value={fmt(pipeDrain)!} />}
        </Section>
      )}

      {(flushVolume || flushType || waterSaving) && (
        <Section title="Công năng">
          {flushVolume && (
            <Row label="Lượng nước xả" value={fmt(flushVolume)!} />
          )}
          {flushType && <Row label="Chế độ xả" value={fmt(flushType)!} />}
          {waterSaving && (
            <Row label="Tiết kiệm nước" value={fmt(waterSaving)!} />
          )}
        </Section>
      )}

      {(material ||
        surfaceCoating ||
        color ||
        techFeatures ||
        certifications) && (
        <Section title="Chất liệu & Tính năng" defaultOpen={false}>
          {material && <Row label="Chất liệu" value={fmt(material)!} />}
          {surfaceCoating && (
            <Row label="Công nghệ men" value={fmt(surfaceCoating)!} />
          )}
          {color && <Row label="Màu sắc" value={fmt(color)!} />}
          {techFeatures && <Row label="Tính năng" value={fmt(techFeatures)!} />}
          {certifications && (
            <Row label="Chứng nhận" value={fmt(certifications)!} />
          )}
        </Section>
      )}

      {(brand || origin || warranty) && (
        <Section title="Thương hiệu & Bảo hành" defaultOpen={false}>
          {brand && <Row label="Thương hiệu" value={fmt(brand)!} />}
          {origin && <Row label="Xuất xứ" value={fmt(origin)!} />}
          {warranty && <Row label="Bảo hành" value={fmt(warranty)!} />}
        </Section>
      )}

      {priceRetail > 0 && isAuthenticated && (
        <div className="rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Giá thành
            </span>
          </div>
          <div className="px-3.5 py-3">
            <p className="text-lg font-black text-gray-900">
              {fmtPrice(priceRetail)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              * Giá tham khảo, chưa bao gồm VAT
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bếp specs ─────────────────────────────────────────────────────────────────
function BepSpecs({ specs }: { specs: Record<string, any> }) {
  const { isAuthenticated } = useAuth();
  const sizeOverall = val(specs, "size_overall", "size");
  const sizeCutout = val(specs, "size_cutout");
  const powerTotal = val(specs, "power_total");
  const voltage = val(specs, "voltage");
  const burnerCount = val(specs, "burner_count");
  const burnerType = val(specs, "burner_type");
  const powerZones = val(specs, "power_zones");
  const surfaceMaterial = val(specs, "surface_material");
  const bodyMaterial = val(specs, "body_material");
  const color = val(specs, "color");
  const controlType = val(specs, "control_type");
  const brand = val(specs, "brand");
  const origin = val(specs, "origin");
  const warranty = val(specs, "warranty");
  const priceRetail = Number(val(specs, "price_retail", "price") ?? 0);
  const fmtPrice = (v: number) =>
    new Intl.NumberFormat("vi-VN").format(v) + "đ";

  const techBadges = [
    { label: "Inverter", active: val(specs, "inverter") === "Có", icon: "⚡" },
    { label: "Boost", active: val(specs, "boost_mode") === "Có", icon: "🚀" },
    { label: "Hẹn giờ", active: val(specs, "timer") === "Có", icon: "⏰" },
  ].filter((b) => b.active);

  const safetyItems = [
    {
      label: "Khóa trẻ em",
      value: val(specs, "safety_child_lock"),
      icon: "🔒",
    },
    {
      label: "Tự ngắt khi trào",
      value: val(specs, "safety_overflow"),
      icon: "💧",
    },
    {
      label: "Cảnh báo nhiệt dư",
      value: val(specs, "safety_residual_heat"),
      icon: "🌡️",
    },
    {
      label: "Tự tắt khi không dùng",
      value: val(specs, "safety_auto_off"),
      icon: "⏱️",
    },
    { label: "Tự ngắt gas", value: val(specs, "safety_gas_cut"), icon: "🔥" },
  ].filter((s) => s.value === "Có");

  return (
    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
      {/* Thông số chính */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
        {sizeOverall && (
          <StatCard
            label="Kích thước phủ bì"
            value={fmt(sizeOverall)!}
            accent
          />
        )}
        {sizeCutout && (
          <StatCard
            label="Kích thước khoét đá"
            value={fmt(sizeCutout)!}
            accent
          />
        )}
        {burnerCount && (
          <StatCard label="Số vùng nấu" value={`${burnerCount} vùng`} />
        )}
        {powerTotal && (
          <StatCard label="Tổng công suất" value={`${powerTotal} W`} />
        )}
      </div>
      {sizeCutout && (
        <p className="text-[10px] text-amber-600 px-1">
          ⚠️ Kích thước khoét đá cần thiết cho thợ thi công
        </p>
      )}

      {(burnerType || voltage || powerZones) && (
        <Section title="Thông số kỹ thuật">
          {burnerType && <Row label="Loại bếp" value={fmt(burnerType)!} />}
          {voltage && <Row label="Điện áp" value={fmt(voltage)!} />}
          {powerZones && (
            <Row label="Công suất từng vùng" value={fmt(powerZones)!} />
          )}
        </Section>
      )}

      {(surfaceMaterial || bodyMaterial || color || controlType) && (
        <Section title="Chất liệu & Điều khiển" defaultOpen={false}>
          {surfaceMaterial && (
            <Row label="Mặt bếp" value={fmt(surfaceMaterial)!} />
          )}
          {bodyMaterial && <Row label="Thân bếp" value={fmt(bodyMaterial)!} />}
          {color && <Row label="Màu sắc" value={fmt(color)!} />}
          {controlType && <Row label="Điều khiển" value={fmt(controlType)!} />}
        </Section>
      )}

      {(techBadges.length > 0 || safetyItems.length > 0) && (
        <Section title="Tính năng">
          {techBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2">
              {techBadges.map((b) => (
                <Badge
                  key={b.label}
                  icon={b.icon}
                  label={b.label}
                  color="blue"
                />
              ))}
            </div>
          )}
          {safetyItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {safetyItems.map((s) => (
                <Badge
                  key={s.label}
                  icon={s.icon}
                  label={s.label}
                  color="green"
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {(brand || origin || warranty) && (
        <Section title="Thương hiệu & Bảo hành" defaultOpen={false}>
          {brand && <Row label="Thương hiệu" value={fmt(brand)!} />}
          {origin && <Row label="Xuất xứ" value={fmt(origin)!} />}
          {warranty && <Row label="Bảo hành" value={fmt(warranty)!} />}
        </Section>
      )}

      {priceRetail > 0 && isAuthenticated && (
        <div className="rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Giá thành
            </span>
          </div>
          <div className="px-3.5 py-3">
            <p className="text-lg font-black text-gray-900">
              {fmtPrice(priceRetail)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              * Giá tham khảo, chưa bao gồm VAT
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ProductSpecs({ specs }: { specs: Record<string, any> }) {
  if (!specs || Object.keys(specs).length === 0) return null;
  const type = detectType(specs);
  if (type === "tbvs") return <TBVSSpecs specs={specs} />;
  if (type === "bep") return <BepSpecs specs={specs} />;
  return <GachSpecs specs={specs} />;
}

export { detectType as detectProductType };
