"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
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
  if (typeof v === "object") {
    // e.g. { width: 600, height: 600 } → "600 x 600"
    const vals = Object.values(v).filter((x) => x !== null && x !== undefined);
    return vals.join(" x ");
  }
  return String(v);
}

function detectType(specs: Record<string, any>): ProductType {
  const t = specs["product_type"];
  if (t === "tbvs" || t === "bep" || t === "phu-tro") return t;
  // Auto-detect from keys
  if (specs["drain_center"] || specs["flush_volume"] || specs["flush_type"])
    return "tbvs";
  if (specs["size_cutout"] || specs["burner_count"] || specs["power_total"])
    return "bep";
  if (specs["pieces_per_box"] || specs["m2_per_box"] || specs["faces"])
    return "gach";
  return "gach";
}

// ── QuickCalc (gạch only) ─────────────────────────────────────────────────────
function QuickCalc({
  piecesPerBox,
  m2PerBox,
}: {
  piecesPerBox: number;
  m2PerBox: number;
}) {
  const [area, setArea] = useState("");
  const totalM2 = Number(area) * 1.1;
  const boxes = area ? Math.ceil(totalM2 / m2PerBox) : null;
  const pieces = boxes !== null ? boxes * piecesPerBox : null;
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
      <p className="text-xs font-semibold text-blue-800 mb-2">
        🧮 Tính nhanh số lượng cần mua
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Diện tích (m²)"
          className="flex-1 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
        {boxes !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-right shrink-0"
          >
            <p className="text-lg font-black text-blue-700">{boxes} thùng</p>
            <p className="text-[10px] text-blue-500">
              {pieces} viên · +10% hao hụt
            </p>
          </motion.div>
        )}
      </div>
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

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start px-3 py-1.5 text-xs border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
      <span className="w-2/5 text-gray-500 shrink-0">{label}</span>
      <span className="w-3/5 font-semibold text-primary">{value}</span>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
        {title}
      </p>
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {children}
      </div>
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
    <div className="space-y-3">
      {(size || thickness || piecesPerBox > 0) && (
        <Group title="Kích thước & Quy cách">
          {size && <Row label="Kích thước" value={`${size} mm`} />}
          {thickness && <Row label="Độ dày" value={`${thickness} mm`} />}
          {faces && <Row label="Số mặt vân" value={`${faces} faces`} />}
          {piecesPerBox > 0 && (
            <Row label="Số viên / thùng" value={`${piecesPerBox} viên`} />
          )}
          {m2PerBox > 0 && (
            <Row label="Diện tích / thùng" value={`${m2PerBox} m²`} />
          )}
          {kgPerBox && (
            <Row label="Trọng lượng / thùng" value={`${kgPerBox} kg`} />
          )}
        </Group>
      )}

      {piecesPerBox > 0 && m2PerBox > 0 && (
        <QuickCalc piecesPerBox={piecesPerBox} m2PerBox={m2PerBox} />
      )}

      {(color || pattern) && (
        <Group title="Màu sắc">
          {color && <Row label="Màu sắc" value={fmt(color)!} />}
          {pattern && <Row label="Vân / Họa tiết" value={fmt(pattern)!} />}
        </Group>
      )}

      {(material || surface || brand || origin) && (
        <Group title="Chất liệu">
          {material && <Row label="Xương gạch" value={fmt(material)!} />}
          {surface && <Row label="Bề mặt" value={fmt(surface)!} />}
          {brand && <Row label="Thương hiệu" value={fmt(brand)!} />}
          {origin && <Row label="Xuất xứ" value={fmt(origin)!} />}
        </Group>
      )}

      {(pairing || style) && (
        <Group title="Cách phối & Không gian phù hợp">
          {style && <Row label="Phong cách" value={fmt(style)!} />}
          {pairing && (
            <div className="px-3 py-2 text-xs">
              <p className="text-gray-500 mb-0.5">Gợi ý phối cảnh</p>
              <p className="text-primary leading-relaxed">{fmt(pairing)}</p>
            </div>
          )}
        </Group>
      )}

      {priceM2 > 0 && isAuthenticated && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Giá thành
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-lg overflow-hidden">
            <div className="flex items-center px-3 py-2 border-b border-amber-100">
              <span className="w-2/5 text-xs text-amber-700">Giá / m²</span>
              <span className="w-3/5 text-lg font-black text-primary">
                {fmtPrice(priceM2)}
              </span>
            </div>
            {priceBox > 0 && (
              <div className="flex items-center px-3 py-2">
                <span className="w-2/5 text-xs text-amber-700">
                  Giá / thùng
                </span>
                <span className="w-3/5 text-base font-bold text-primary">
                  {fmtPrice(priceBox)}
                  {m2PerBox > 0 && (
                    <span className="text-[10px] font-normal text-gray-500 ml-1">
                      ({m2PerBox} m²)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 px-1">
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
    <div className="space-y-3">
      {(drainCenter ||
        waterPressure ||
        pipeInlet ||
        pipeDrain ||
        installType) && (
        <Group title="Thông số lắp đặt">
          {drainCenter && <Row label="Tâm xả" value={fmt(drainCenter)!} />}
          {installType && (
            <Row label="Kiểu lắp đặt" value={fmt(installType)!} />
          )}
          {waterPressure && (
            <Row label="Áp lực nước tối thiểu" value={`${waterPressure} bar`} />
          )}
          {pipeInlet && <Row label="Ống cấp nước" value={fmt(pipeInlet)!} />}
          {pipeDrain && <Row label="Ống thoát nước" value={fmt(pipeDrain)!} />}
        </Group>
      )}

      {(size || roughIn) && (
        <Group title="Kích thước">
          {size && <Row label="Kích thước" value={fmt(size)!} />}
          {roughIn && <Row label="Khoảng cách lắp đặt" value={fmt(roughIn)!} />}
        </Group>
      )}

      {(flushVolume || flushType || waterSaving) && (
        <Group title="Công năng">
          {flushVolume && (
            <Row label="Lượng nước xả" value={fmt(flushVolume)!} />
          )}
          {flushType && <Row label="Chế độ xả" value={fmt(flushType)!} />}
          {waterSaving && (
            <Row label="Tiết kiệm nước" value={fmt(waterSaving)!} />
          )}
        </Group>
      )}

      {(material || surfaceCoating || color) && (
        <Group title="Chất liệu & Công nghệ">
          {material && <Row label="Chất liệu" value={fmt(material)!} />}
          {surfaceCoating && (
            <Row label="Công nghệ men / Bề mặt" value={fmt(surfaceCoating)!} />
          )}
          {color && <Row label="Màu sắc" value={fmt(color)!} />}
        </Group>
      )}

      {(techFeatures || certifications) && (
        <Group title="Tính năng & Chứng nhận">
          {techFeatures && <Row label="Tính năng" value={fmt(techFeatures)!} />}
          {certifications && (
            <Row label="Chứng nhận" value={fmt(certifications)!} />
          )}
        </Group>
      )}

      {(brand || origin || warranty) && (
        <Group title="Xuất xứ & Bảo hành">
          {brand && <Row label="Thương hiệu" value={fmt(brand)!} />}
          {origin && <Row label="Xuất xứ" value={fmt(origin)!} />}
          {warranty && <Row label="Bảo hành" value={fmt(warranty)!} />}
        </Group>
      )}

      {priceRetail > 0 && isAuthenticated && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Giá thành
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <p className="text-lg font-black text-primary">
              {fmtPrice(priceRetail)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              * Giá tham khảo, chưa bao gồm VAT và phí vận chuyển
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
  const sizePanel = val(specs, "size_panel");
  const powerTotal = val(specs, "power_total");
  const voltage = val(specs, "voltage");
  const burnerCount = val(specs, "burner_count");
  const burnerType = val(specs, "burner_type");
  const powerZones = val(specs, "power_zones");
  const surfaceMaterial = val(specs, "surface_material");
  const bodyMaterial = val(specs, "body_material");
  const color = val(specs, "color");
  const controlType = val(specs, "control_type");
  const boostMode = val(specs, "boost_mode");
  const timer = val(specs, "timer");
  const inverter = val(specs, "inverter");
  const safetyChildLock = val(specs, "safety_child_lock");
  const safetyOverflow = val(specs, "safety_overflow");
  const safetyResidualHeat = val(specs, "safety_residual_heat");
  const safetyAutoOff = val(specs, "safety_auto_off");
  const safetyGasCut = val(specs, "safety_gas_cut");
  const brand = val(specs, "brand");
  const origin = val(specs, "origin");
  const warranty = val(specs, "warranty");
  const priceRetail = Number(val(specs, "price_retail", "price") ?? 0);
  const fmtPrice = (v: number) =>
    new Intl.NumberFormat("vi-VN").format(v) + "đ";

  // Safety features as icons
  const safetyItems = [
    { label: "Khóa trẻ em", value: safetyChildLock, icon: "🔒" },
    { label: "Tự ngắt khi trào nước", value: safetyOverflow, icon: "💧" },
    { label: "Cảnh báo nhiệt dư", value: safetyResidualHeat, icon: "🌡️" },
    { label: "Tự tắt khi không dùng", value: safetyAutoOff, icon: "⏱️" },
    { label: "Tự ngắt gas", value: safetyGasCut, icon: "🔥" },
  ].filter((s) => s.value === "Có");

  // Tech feature badges
  const techBadges = [
    { label: "Inverter", active: inverter === "Có", icon: "⚡" },
    { label: "Boost", active: boostMode === "Có", icon: "🚀" },
    { label: "Hẹn giờ", active: timer === "Có", icon: "⏰" },
  ].filter((b) => b.active);

  return (
    <div className="space-y-3">
      {(sizeOverall || sizeCutout || sizePanel) && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Kích thước
          </p>
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            {sizeOverall && (
              <Row label="Kích thước phủ bì" value={fmt(sizeOverall)!} />
            )}
            {sizeCutout && (
              <div className="flex items-start px-3 py-1.5 text-xs border-b border-gray-50 last:border-0 bg-yellow-50">
                <span className="w-2/5 text-amber-700 shrink-0 font-medium">
                  Kích thước khoét đá
                </span>
                <span className="w-3/5 font-bold text-amber-800">
                  {fmt(sizeCutout)}
                </span>
              </div>
            )}
            {sizePanel && (
              <Row label="Kích thước mặt bếp" value={fmt(sizePanel)!} />
            )}
          </div>
          {sizeCutout && (
            <p className="text-[10px] text-amber-600 mt-1 px-1">
              ⚠️ Kích thước khoét đá cần thiết cho thợ thi công
            </p>
          )}
        </div>
      )}

      {(powerTotal || voltage || burnerCount || burnerType || powerZones) && (
        <Group title="Thông số điện / Kỹ thuật">
          {burnerType && <Row label="Loại bếp" value={fmt(burnerType)!} />}
          {burnerCount && (
            <Row label="Số vùng nấu" value={`${burnerCount} vùng`} />
          )}
          {powerTotal && (
            <Row label="Tổng công suất" value={`${powerTotal} W`} />
          )}
          {voltage && <Row label="Điện áp" value={fmt(voltage)!} />}
          {powerZones && (
            <Row label="Công suất từng vùng" value={fmt(powerZones)!} />
          )}
        </Group>
      )}

      {(surfaceMaterial || bodyMaterial || color) && (
        <Group title="Chất liệu">
          {surfaceMaterial && (
            <Row label="Mặt bếp" value={fmt(surfaceMaterial)!} />
          )}
          {bodyMaterial && <Row label="Thân bếp" value={fmt(bodyMaterial)!} />}
          {color && <Row label="Màu sắc" value={fmt(color)!} />}
        </Group>
      )}

      {(controlType || techBadges.length > 0) && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Tính năng
          </p>
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            {controlType && (
              <Row label="Điều khiển" value={fmt(controlType)!} />
            )}
          </div>
          {techBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {techBadges.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold rounded-full"
                >
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {safetyItems.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Tính năng an toàn
          </p>
          <div className="flex flex-wrap gap-1.5">
            {safetyItems.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold rounded-full"
              >
                {s.icon} {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {(brand || origin || warranty) && (
        <Group title="Xuất xứ & Bảo hành">
          {brand && <Row label="Thương hiệu" value={fmt(brand)!} />}
          {origin && <Row label="Xuất xứ" value={fmt(origin)!} />}
          {warranty && <Row label="Bảo hành" value={fmt(warranty)!} />}
        </Group>
      )}

      {priceRetail > 0 && isAuthenticated && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Giá thành
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <p className="text-lg font-black text-primary">
              {fmtPrice(priceRetail)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              * Giá tham khảo, chưa bao gồm VAT và phí vận chuyển
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface ProductSpecsProps {
  specs: Record<string, any>;
}

export function ProductSpecs({ specs }: ProductSpecsProps) {
  if (!specs || Object.keys(specs).length === 0) return null;
  const type = detectType(specs);

  if (type === "tbvs") return <TBVSSpecs specs={specs} />;
  if (type === "bep") return <BepSpecs specs={specs} />;
  return <GachSpecs specs={specs} />;
}

// Export type for use in page.tsx
export { detectType as detectProductType };
