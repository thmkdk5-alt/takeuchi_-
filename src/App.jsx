import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  LayoutGrid, Users, ClipboardCheck, Settings, ArrowLeft, Search,
  ChevronDown, ChevronRight, MapPin, Check, Pencil, RotateCcw, AlertCircle, X, Info,
  BookOpen, ArrowDown, TrendingUp
} from "lucide-react";

/* ============================== 定数 ============================== */

const POLICY_OPTIONS = ["取り切る", "攻める", "育てる", "見極める", "見送る"];
const GRADE_OPTIONS = ["◎", "○", "△", "✕"];

const DEFAULT_POLICY_MATRIX = {
  A: { 1: "育てる", 2: "育てる", 3: "攻める", 4: "取り切る", 5: "取り切る" },
  B: { 1: "見極める", 2: "育てる", 3: "攻める", 4: "攻める", 5: "取り切る" },
  C: { 1: "見送る", 2: "見極める", 3: "見極める", 4: "見極める", 5: "見極める" },
  D: { 1: "見送る", 2: "見送る", 3: "見送る", 4: "見送る", 5: "見送る" },
};

const DEFAULT_COMPANY_SIZE_MASTER = {
  "部品メーカー・トヨタ系": { great: 3000, good: 1500, fair: 1000 },
  "部品メーカー・その他": { great: 2000, good: 1000, fair: 700 },
  "完成品メーカー": { great: 1500, good: 700, fair: 500 },
};

const DEFAULT_AREA_MASTER = [
  { id: "t1", label: "名古屋・東京・大阪から概ね1時間圏", grade: "◎" },
  { id: "t2", label: "新幹線を利用して日帰り訪問・継続フォローが可能", grade: "○" },
  { id: "t3", label: "その他国内", grade: "△" },
  { id: "t4", label: "継続的な営業活動が物理的に困難", grade: "✕" },
];

const DEFAULT_SIZE_THRESHOLDS = { large: 400, medium: 200, small: 100 }; // 単位：M（百万円）

const DEFAULT_LICENSE_FORECAST = { small: 5, medium: 10, large: 15 }; // 単位：M
const DEFAULT_MAINTENANCE_FORECAST = { small: 10, medium: 15, large: 20 }; // 単位：M（年間）
const DEFAULT_PROJECT_DURATION = { small: 12, medium: 18, large: 24 }; // 単位：ヶ月
const DEFAULT_REVENUE_PHASES = [
  { name: "要件定義", durationRatio: 0.25, amountRatio: 0.20 },
  { name: "システム開発", durationRatio: 0.75, amountRatio: 0.80 },
];
const DEFAULT_ADDITIONAL_DEV_RULE = { startAfterGoLiveMonths: 12, cycleMonths: 12 };

const DEFAULT_INDUSTRY_MASTER = [
  { name: "自動車部品", grade: "◎" },
  { name: "産業機械", grade: "◎" },
  { name: "電機・電子", grade: "○" },
  { name: "重工業", grade: "△" },
  { name: "完成車", grade: "△" },
  { name: "住設", grade: "△" },
  { name: "プロセス製造業", grade: "✕" },
];

const DEFAULT_ISSUE_ATTRIBUTE_MASTER = [
  { name: "製品情報管理", desc: "BOM・BOP・図面・文書・属性・構成・変更履歴などを適切に管理できているか" },
  { name: "業務横断", desc: "設計・生技・調達・品質・生産などで情報が分断されていないか" },
  { name: "変更管理", desc: "設計変更・工程変更・仕様変更の影響や履歴を管理できているか" },
  { name: "標準化", desc: "拠点・部門・製品ごとに異なる業務や管理方法を統一したいか" },
  { name: "データ活用", desc: "蓄積情報を検索・比較・分析・判断支援・AI活用につなげたいか" },
  { name: "業務改革", desc: "現行業務の単純なシステム化ではなく、プロセス自体を見直したいか" },
];

const DEFAULT_SCOPE_MASTER = [
  { name: "図面・文書管理" }, { name: "E-BOM" }, { name: "BOP" }, { name: "変更管理" },
  { name: "構成管理" }, { name: "バリエーション管理" }, { name: "設計～生産準備" },
  { name: "調達・品質・原価・生産への活用" }, { name: "全社製品情報活用" },
];

const DEFAULT_PRODUCT_CHAR_MASTER = [
  { name: "製品構成の複雑性", desc: "部品点数、ASSY構成、階層、構成差異が多いか" },
  { name: "バリエーションの多さ", desc: "品種、仕様、派生、顧客別構成が多いか" },
  { name: "変更の多さ", desc: "設計変更、仕様変更、法規対応、派生開発が多いか" },
  { name: "生産準備の複雑性", desc: "工程設計、設備・治具、拠点・ライン展開の調整が難しいか" },
  { name: "拠点・組織の複雑性", desc: "複数工場・グローバル拠点で情報統制が必要か" },
];

const DEFAULT_EXPANSION_TYPE_MASTER = [
  { name: "組織展開", desc: "他部門・他事業部・他工場・他拠点・グループ会社への展開" },
  { name: "領域展開", desc: "機能拡張・業務領域拡張・次期導入構想" },
  { name: "市場展開", desc: "同業他社・他業界・提案モデル再利用・重点市場実績" },
];

const DEFAULT_MATURITY_ITEM_MASTER = [
  { name: "背景・課題", levels: [true, true, true, true, true] },
  { name: "導入目的・To-Be", levels: [false, true, true, true, true] },
  { name: "対象範囲", levels: [false, true, true, true, true] },
  { name: "期待効果・投資効果", levels: [false, true, true, true, true] },
  { name: "予算", levels: [false, true, true, true, true] },
  { name: "スケジュール", levels: [false, true, true, true, true] },
  { name: "推進体制・意思決定者", levels: [true, true, true, true, true] },
  { name: "要件", levels: [false, true, true, true, true] },
  { name: "評価基準・RFP", levels: [false, false, true, true, true] },
  { name: "契約・導入計画", levels: [false, false, true, true, true] },
];

const DEFAULT_INFO_COMPLETENESS_MASTER = { sufficientRatio: 0.7 };

const DEFAULT_POLICY_COLOR_MASTER = {
  取り切る: "red", 攻める: "blue", 育てる: "emerald", 見極める: "amber", 見送る: "gray",
};

const COLOR_PALETTE = {
  red: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-700", chip: "bg-red-100 text-red-800 border-red-200", swatch: "bg-red-500" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-700", chip: "bg-blue-100 text-blue-800 border-blue-200", swatch: "bg-blue-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-800 border-emerald-200", swatch: "bg-emerald-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", chip: "bg-amber-100 text-amber-800 border-amber-200", swatch: "bg-amber-500" },
  gray: { bg: "bg-gray-100", border: "border-gray-200", dot: "bg-gray-400", text: "text-gray-500", chip: "bg-gray-200 text-gray-600 border-gray-300", swatch: "bg-gray-400" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500", text: "text-purple-700", chip: "bg-purple-100 text-purple-800 border-purple-200", swatch: "bg-purple-500" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", dot: "bg-teal-500", text: "text-teal-700", chip: "bg-teal-100 text-teal-800 border-teal-200", swatch: "bg-teal-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", text: "text-orange-700", chip: "bg-orange-100 text-orange-800 border-orange-200", swatch: "bg-orange-500" },
};

const GRADE_STYLE = {
  "◎": "text-blue-700 bg-blue-50 border-blue-200",
  "○": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "△": "text-amber-700 bg-amber-50 border-amber-200",
  "✕": "text-gray-500 bg-gray-100 border-gray-300",
};

const EVIDENCE_STYLE = {
  事実: "text-emerald-700 bg-emerald-50",
  営業仮説: "text-blue-700 bg-blue-50",
  AI仮説: "text-amber-700 bg-amber-50",
  未確認: "text-gray-500 bg-gray-100",
};

function getFiscalYearLabel(offset) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const fiscalStartYear = (m >= 4 ? y : y - 1) + offset;
  return `${fiscalStartYear}年4月〜${fiscalStartYear + 1}年3月`;
}
const FISCAL_YEAR_LABELS = { current: getFiscalYearLabel(0), next: getFiscalYearLabel(1) };

const MasterContext = createContext(null);
const useMasters = () => useContext(MasterContext);

const STORAGE_KEYS = {
  overrides: "customer-overrides-v1", masters: "masters-v1", selection: "revenue-selection-v1",
  added: "customers-added-v1", deleted: "customers-deleted-v1", softDeleted: "customers-soft-deleted-v1",
};

async function storageGet(key) {
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}
async function storageSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
    return true;
  } catch (e) {
    console.error("storage save failed:", key, e);
    return false;
  }
}
async function storageDeleteAll() {
  for (const key of Object.values(STORAGE_KEYS)) {
    try { await window.storage.delete(key, false); } catch (e) { /* ignore missing key */ }
  }
}

/* ============================== 判定ロジック（マスター参照） ============================== */

function gradeBySize(revenue, companyType, companySizeMaster) {
  const t = companySizeMaster[companyType];
  if (!t) return "△";
  if (revenue >= t.great) return "◎";
  if (revenue >= t.good) return "○";
  if (revenue >= t.fair) return "△";
  return "✕";
}
function gradeByArea(areaTierId, areaMaster) {
  const tier = areaMaster.find((a) => a.id === areaTierId);
  return tier ? tier.grade : "△";
}
function gradeByIndustry(industryName, industryMaster) {
  const row = industryMaster.find((i) => i.name === industryName);
  return row ? row.grade : "△";
}
function judgeTarget(industry, size, area) {
  const vals = [industry, size, area];
  if (vals.includes("✕")) return "対象外";
  if (vals.includes("△")) return "チャレンジ";
  return "ターゲット";
}
const TARGET_MARK = { ターゲット: "◎", チャレンジ: "○", 対象外: "✕" };

function sizeCategory(amount, thresholds) {
  if (amount >= thresholds.large) return "large";
  if (amount >= thresholds.medium) return "medium";
  if (amount >= thresholds.small) return "small";
  return "none";
}
function judgeProfitability(amount, hasMaintenance, thresholds) {
  const cat = sizeCategory(amount, thresholds);
  if (cat === "large") return hasMaintenance ? "◎" : "○";
  if (cat === "medium") return hasMaintenance ? "◎" : "△";
  if (cat === "small") return hasMaintenance ? "○" : "✕";
  return "✕";
}
function sizeLabel(amount, thresholds) {
  const cat = sizeCategory(amount, thresholds);
  return { large: "大", medium: "中", small: "小", none: "対象外" }[cat];
}
function judgeRank(fit, profit, expand) {
  if (fit === "✕" || profit === "✕" || expand === "✕") return "D";
  const ge = (g) => g === "◎" || g === "○";
  if (fit === "◎" && ge(profit) && ge(expand)) return "A";
  if (fit === "◎") return "B";
  if (fit === "○" && (ge(profit) || ge(expand))) return "B";
  if (fit === "○") return "C";
  if (fit === "△") return "C";
  return "D";
}
// 提案時期の目安（Lv4以上は提案中、Lv3でA/Bランクは今期予定、Lv1-2でランクD以外は来期予定）
function proposalTiming(rank, level) {
  if (level >= 4) return "提案中";
  if (level === 3 && (rank === "A" || rank === "B")) return "今期予定";
  if (level <= 2 && rank !== "D") return "来期予定";
  return null;
}
const STATUS_OPTIONS = ["未確認", "仮説", "整理中", "明確", "合意済み"];
const EVIDENCE_OPTIONS = ["未確認", "AI仮説", "営業仮説", "事実"];

// マスターの●パターンと整合するデフォルトの論点データを生成（未編集の顧客の初期値）
function defaultTopicData(seedLevel, maturityItemMaster, seed) {
  return maturityItemMaster.map((item, i) => {
    const levels = item.levels || [];
    const requiredBySeed = !!levels[seedLevel - 1];
    let status, evidence;
    if (requiredBySeed) {
      status = seedLevel >= 5 ? "合意済み" : "明確";
      evidence = (seed + i) % 4 === 0 ? "営業仮説" : "事実";
    } else {
      const neededLater = levels.some((v, idx) => v && idx + 1 > seedLevel);
      status = neededLater ? "仮説" : "未確認";
      evidence = neededLater ? "AI仮説" : "未確認";
    }
    return { name: item.name, status, evidence };
  });
}
// AI仮説のみの情報では「明確」以上にできないというルールを適用
function clampStatusByEvidence(status, evidence) {
  if ((status === "明確" || status === "合意済み") && evidence === "AI仮説") return "仮説";
  return status;
}
// 論点ごとの状態（マスターの●パターン）と実際の確認状況を照合し、成熟度Lvを逆算する
function deriveMaturityLevel(topicData, maturityItemMaster) {
  const isConfirmed = (s) => s === "明確" || s === "合意済み";
  for (let L = 5; L >= 1; L--) {
    const ok = maturityItemMaster.every((item, i) => {
      const required = !!(item.levels && item.levels[L - 1]);
      if (!required) return true;
      const td = topicData[i];
      return td && isConfirmed(td.status);
    });
    if (ok) return L;
  }
  return 1;
}
function computeInfoCompleteness(maturityStatuses, infoMaster) {
  const filled = maturityStatuses.filter((i) => i.status !== "未確認" && i.status !== "未着手").length;
  const ratio = filled / maturityStatuses.length;
  if (filled === 0) return "未評価";
  if (ratio >= infoMaster.sufficientRatio) return "十分";
  return "不足あり";
}

/* ============================== モックデータ ============================== */

const RAW_CUSTOMERS = [
  { id: 1, name: "東京エレクトロンデバイス", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 2040, areaTierId: "t1", areaDetail: "神奈川県エリア", fit: "◎", expand: "◎", siAmountM: 150, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 5, owner: "岡崎", prefecture: "神奈川県", department: "PB", lastUpdated: "2026/07/12" },
  { id: 2, name: "豊田自動織機", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 40000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "○", siAmountM: 200, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 5, owner: "梅村", prefecture: "愛知県", department: "エレクトロニクス", lastUpdated: "2026/07/08" },
  { id: 3, name: "デンソーエアシステムズ", industry: "自動車部品", companyType: "部品メーカー・トヨタ系", isToyotaGroup: true, revenue: 800, areaTierId: "t2", areaDetail: "群馬県エリア", fit: "○", expand: "◎", siAmountM: 250, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 4, owner: "酒井", prefecture: "群馬県", department: null, lastUpdated: "2026/07/01" },
  { id: 4, name: "アラタス(旧オムロン電子部品)", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 1050, areaTierId: "t1", areaDetail: "京都府エリア", fit: "○", expand: "○", siAmountM: 300, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 4, owner: "矢野", prefecture: "京都府", department: null, lastUpdated: "2026/06/28" },
  { id: 5, name: "ホーチキ", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 1060, areaTierId: "t1", areaDetail: "東京都エリア", fit: "○", expand: "△", siAmountM: 350, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 4, owner: "友田", prefecture: "東京都", department: null, lastUpdated: "2026/06/20" },
  { id: 6, name: "ニチリン", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 737, areaTierId: "t2", areaDetail: "兵庫県エリア", fit: "△", expand: "◎", siAmountM: 400, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 4, owner: "福田", prefecture: "兵庫県", department: null, lastUpdated: "2026/06/10" },
  { id: 7, name: "遠藤照明", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 530, areaTierId: "t1", areaDetail: "大阪府エリア", fit: "△", expand: "○", siAmountM: 450, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 4, owner: "内田", prefecture: "大阪府", department: null, lastUpdated: "2026/06/02" },
  { id: 8, name: "NOK", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 7380, areaTierId: "t1", areaDetail: "東京都エリア", fit: "◎", expand: "△", siAmountM: 500, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 3, owner: "宇水", prefecture: "東京都", department: null, lastUpdated: "2026/05/25" },
  { id: 9, name: "デルタ工業", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 895, areaTierId: "t2", areaDetail: "広島県エリア", fit: "△", expand: "△", siAmountM: 600, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 3, owner: "竹内", prefecture: "広島県", department: null, lastUpdated: "2026/05/12" },
  { id: 10, name: "トヨタ自動車東日本", industry: "完成車", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 10000, areaTierId: "t3", areaDetail: "岩手県エリア", fit: "○", expand: "✕", siAmountM: 700, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 3, owner: "岡崎", prefecture: "岩手県", department: null, lastUpdated: "2026/04/18" },
  { id: 11, name: "村上開明堂", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 1100, areaTierId: "t2", areaDetail: "静岡県エリア", fit: "✕", expand: "○", siAmountM: 100, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 3, owner: "梅村", prefecture: "静岡県", department: null, lastUpdated: "2026/07/12" },
  { id: 12, name: "東海理化", industry: "自動車部品", companyType: "部品メーカー・トヨタ系", isToyotaGroup: true, revenue: 6500, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "◎", siAmountM: 150, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 2, owner: "酒井", prefecture: "愛知県", department: null, lastUpdated: "2026/07/08" },
  { id: 13, name: "豊田合成", industry: "自動車部品", companyType: "部品メーカー・トヨタ系", isToyotaGroup: true, revenue: 11000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "○", siAmountM: 200, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 2, owner: "矢野", prefecture: "愛知県", department: null, lastUpdated: "2026/07/01" },
  { id: 14, name: "コマツ", industry: "産業機械", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 40000, areaTierId: "t1", areaDetail: "東京都エリア", fit: "○", expand: "◎", siAmountM: 250, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 2, owner: "友田", prefecture: "東京都", department: null, lastUpdated: "2026/06/28" },
  { id: 15, name: "太平洋工業", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 2200, areaTierId: "t1", areaDetail: "岐阜県エリア", fit: "○", expand: "○", siAmountM: 300, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 2, owner: "福田", prefecture: "岐阜県", department: null, lastUpdated: "2026/06/20" },
  { id: 16, name: "豊通オートモーティブクリエーション", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 900, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "○", expand: "△", siAmountM: 350, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 2, owner: "内田", prefecture: "愛知県", department: null, lastUpdated: "2026/06/10" },
  { id: 17, name: "多摩川精機", industry: "産業機械", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 500, areaTierId: "t2", areaDetail: "長野県エリア", fit: "△", expand: "◎", siAmountM: 400, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 2, owner: "宇水", prefecture: "長野県", department: null, lastUpdated: "2026/06/02" },
  { id: 18, name: "CKD", industry: "産業機械", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 1500, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "△", expand: "○", siAmountM: 450, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 2, owner: "竹内", prefecture: "愛知県", department: null, lastUpdated: "2026/05/25" },
  { id: 19, name: "シチズンマシナリー", industry: "産業機械", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 800, areaTierId: "t2", areaDetail: "長野県エリア", fit: "◎", expand: "△", siAmountM: 500, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 2, owner: "岡崎", prefecture: "長野県", department: null, lastUpdated: "2026/05/12" },
  { id: 20, name: "豊臣機工", industry: "産業機械", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 400, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "△", expand: "△", siAmountM: 600, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 2, owner: "梅村", prefecture: "愛知県", department: null, lastUpdated: "2026/04/18" },
  { id: 21, name: "スズキ", industry: "完成車", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 60000, areaTierId: "t2", areaDetail: "静岡県エリア", fit: "○", expand: "✕", siAmountM: 700, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 2, owner: "酒井", prefecture: "静岡県", department: null, lastUpdated: "2026/07/12" },
  { id: 22, name: "中央発條", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 1100, areaTierId: "t1", areaDetail: "神奈川県エリア", fit: "✕", expand: "○", siAmountM: 100, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 1, owner: "矢野", prefecture: "神奈川県", department: null, lastUpdated: "2026/07/08" },
  { id: 23, name: "愛三工業", industry: "自動車部品", companyType: "部品メーカー・トヨタ系", isToyotaGroup: true, revenue: 3500, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "◎", siAmountM: 150, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 1, owner: "友田", prefecture: "愛知県", department: null, lastUpdated: "2026/07/01" },
  { id: 24, name: "ヤマザキマザック", industry: "産業機械", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 4000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "○", siAmountM: 200, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 1, owner: "福田", prefecture: "愛知県", department: null, lastUpdated: "2026/06/28" },
  { id: 25, name: "豊田自動織機", industry: "自動車部品", companyType: "部品メーカー・トヨタ系", isToyotaGroup: true, revenue: 40000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "○", expand: "◎", siAmountM: 250, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 1, owner: "内田", prefecture: "愛知県", department: "コンプレッサ", lastUpdated: "2026/06/20" },
  { id: 26, name: "ハイレックスコーポレーション", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 3000, areaTierId: "t2", areaDetail: "兵庫県エリア", fit: "○", expand: "○", siAmountM: 300, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 1, owner: "宇水", prefecture: "兵庫県", department: null, lastUpdated: "2026/06/10" },
  { id: 27, name: "小糸製作所", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 9360, areaTierId: "t2", areaDetail: "静岡県エリア", fit: "○", expand: "△", siAmountM: 350, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 1, owner: "竹内", prefecture: "静岡県", department: null, lastUpdated: "2026/06/02" },
  { id: 28, name: "日産モータースポーツ＆カスタマイズ", industry: "完成車", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 900, areaTierId: "t1", areaDetail: "神奈川県エリア", fit: "△", expand: "◎", siAmountM: 400, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 1, owner: "岡崎", prefecture: "神奈川県", department: null, lastUpdated: "2026/05/25" },
  { id: 29, name: "三菱重工交通・建設エンジニアリング", industry: "重工業", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 1000, areaTierId: "t1", areaDetail: "神奈川県エリア", fit: "△", expand: "○", siAmountM: 450, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 1, owner: "梅村", prefecture: "神奈川県", department: null, lastUpdated: "2026/05/12" },
  { id: 30, name: "林テレンプ", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 3000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "△", siAmountM: 500, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 1, owner: "酒井", prefecture: "愛知県", department: null, lastUpdated: "2026/04/18" },
  { id: 31, name: "デンソー", industry: "自動車部品", companyType: "部品メーカー・トヨタ系", isToyotaGroup: true, revenue: 70000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "△", expand: "△", siAmountM: 600, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 1, owner: "矢野", prefecture: "愛知県", department: null, lastUpdated: "2026/07/12" },
  { id: 32, name: "大豊工業", industry: "自動車部品", companyType: "部品メーカー・トヨタ系", isToyotaGroup: true, revenue: 1200, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "○", expand: "✕", siAmountM: 700, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 1, owner: "友田", prefecture: "愛知県", department: null, lastUpdated: "2026/07/08" },
  { id: 33, name: "豊田自動織機", industry: "産業機械", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 40000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "✕", expand: "○", siAmountM: 100, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 1, owner: "福田", prefecture: "愛知県", department: null, lastUpdated: "2026/07/01" },
  { id: 34, name: "パナソニックインダストリー", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 11000, areaTierId: "t1", areaDetail: "大阪府エリア", fit: "◎", expand: "◎", siAmountM: 150, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 1, owner: "内田", prefecture: "大阪府", department: null, lastUpdated: "2026/06/28" },
  { id: 35, name: "グローリ", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 4000, areaTierId: "t2", areaDetail: "兵庫県エリア", fit: "◎", expand: "○", siAmountM: 200, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 1, owner: "宇水", prefecture: "兵庫県", department: null, lastUpdated: "2026/06/20" },
  { id: 36, name: "サトー", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 1600, areaTierId: "t1", areaDetail: "東京都エリア", fit: "○", expand: "◎", siAmountM: 250, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 1, owner: "竹内", prefecture: "東京都", department: null, lastUpdated: "2026/06/10" },
  { id: 37, name: "明電舎", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 3200, areaTierId: "t1", areaDetail: "東京都エリア", fit: "○", expand: "○", siAmountM: 300, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 1, owner: "岡崎", prefecture: "東京都", department: null, lastUpdated: "2026/06/02" },
  { id: 38, name: "富士電機", industry: "電機・電子", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 11500, areaTierId: "t1", areaDetail: "東京都エリア", fit: "○", expand: "△", siAmountM: 350, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 1, owner: "梅村", prefecture: "東京都", department: null, lastUpdated: "2026/05/25" },
  { id: 39, name: "ヤマハ発動機", industry: "完成車", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 26000, areaTierId: "t2", areaDetail: "静岡県エリア", fit: "△", expand: "◎", siAmountM: 400, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 1, owner: "酒井", prefecture: "静岡県", department: null, lastUpdated: "2026/05/12" },
  { id: 40, name: "ジェイテクト", industry: "自動車部品", companyType: "部品メーカー・トヨタ系", isToyotaGroup: true, revenue: 19250, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "△", expand: "○", siAmountM: 450, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 1, owner: "矢野", prefecture: "愛知県", department: null, lastUpdated: "2026/04/18" },
  { id: 41, name: "豊田自動織機", industry: "産業機械", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 40000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "△", siAmountM: 500, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 1, owner: "友田", prefecture: "愛知県", department: "L&F", lastUpdated: "2026/07/12" },
  { id: 42, name: "矢崎総業", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 26000, areaTierId: "t2", areaDetail: "静岡県エリア", fit: "△", expand: "△", siAmountM: 600, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 1, owner: "福田", prefecture: "静岡県", department: null, lastUpdated: "2026/07/08" },
  { id: 43, name: "トリニティ工業", industry: "自動車部品", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 1400, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "○", expand: "✕", siAmountM: 700, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 1, owner: "内田", prefecture: "愛知県", department: null, lastUpdated: "2026/07/01" },
  { id: 44, name: "ポラス", industry: "住設", companyType: "完成品メーカー", isToyotaGroup: false, revenue: 4000, areaTierId: "t1", areaDetail: "埼玉県エリア", fit: "✕", expand: "○", siAmountM: 100, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 1, owner: "宇水", prefecture: "埼玉県", department: null, lastUpdated: "2026/06/28" },
  { id: 45, name: "メイドー", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 700, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "◎", siAmountM: 150, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 5, owner: "竹内", prefecture: "愛知県", department: null, lastUpdated: "2026/06/20" },
  { id: 46, name: "今仙電機製作所", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 1000, areaTierId: "t1", areaDetail: "岐阜県エリア", fit: "◎", expand: "○", siAmountM: 200, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 1, owner: "岡崎", prefecture: "岐阜県", department: null, lastUpdated: "2026/06/10" },
  { id: 47, name: "フェローテック", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 2700, areaTierId: "t1", areaDetail: "東京都エリア", fit: "○", expand: "◎", siAmountM: 250, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 2, owner: "梅村", prefecture: "東京都", department: null, lastUpdated: "2026/06/02" },
  { id: 48, name: "オークマ", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 2200, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "○", expand: "○", siAmountM: 300, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 3, owner: "酒井", prefecture: "愛知県", department: null, lastUpdated: "2026/05/25" },
  { id: 49, name: "TOWA", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 650, areaTierId: "t1", areaDetail: "京都府エリア", fit: "○", expand: "△", siAmountM: 350, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 4, owner: "矢野", prefecture: "京都府", department: null, lastUpdated: "2026/05/12" },
  { id: 50, name: "共栄社", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 100, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "△", expand: "◎", siAmountM: 400, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 5, owner: "友田", prefecture: "愛知県", department: null, lastUpdated: "2026/04/18" },
  { id: 51, name: "三菱電機", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 58000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "△", expand: "○", siAmountM: 450, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 1, owner: "福田", prefecture: "愛知県", department: "名古屋製作所", lastUpdated: "2026/07/12" },
  { id: 52, name: "日本航空電子工業", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 2300, areaTierId: "t1", areaDetail: "東京都エリア", fit: "◎", expand: "△", siAmountM: 500, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 2, owner: "内田", prefecture: "東京都", department: null, lastUpdated: "2026/07/08" },
  { id: 53, name: "トヨタ紡織", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 20000, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "△", expand: "△", siAmountM: 600, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 3, owner: "宇水", prefecture: "愛知県", department: null, lastUpdated: "2026/07/01" },
  { id: 54, name: "ニイテック", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 400, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "○", expand: "✕", siAmountM: 700, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 4, owner: "竹内", prefecture: "愛知県", department: null, lastUpdated: "2026/06/28" },
  { id: 55, name: "大橋鉄工", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 100, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "✕", expand: "○", siAmountM: 100, hasMaintenance: true, amountConfidence: "仮説", maturityLevel: 5, owner: "岡崎", prefecture: "愛知県", department: null, lastUpdated: "2026/06/20" },
  { id: 56, name: "寺嶋工業所", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 900, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "◎", siAmountM: 150, hasMaintenance: false, amountConfidence: "概算", maturityLevel: 1, owner: "梅村", prefecture: "愛知県", department: null, lastUpdated: "2026/06/10" },
  { id: 57, name: "竹中電機", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 75, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "◎", expand: "○", siAmountM: 200, hasMaintenance: true, amountConfidence: "確定", maturityLevel: 2, owner: "酒井", prefecture: "愛知県", department: null, lastUpdated: "2026/06/02" },
  { id: 58, name: "上田日本無線", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 200, areaTierId: "t2", areaDetail: "長野県エリア", fit: "○", expand: "◎", siAmountM: 250, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 3, owner: "矢野", prefecture: "長野県", department: null, lastUpdated: "2026/05/25" },
  { id: 59, name: "キョーラク", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 700, areaTierId: "t1", areaDetail: "大阪府エリア", fit: "○", expand: "○", siAmountM: 300, hasMaintenance: true, amountConfidence: "概算", maturityLevel: 4, owner: "友田", prefecture: "大阪府", department: null, lastUpdated: "2026/05/12" },
  { id: 60, name: "富士工機", industry: "プロセス製造業", companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 900, areaTierId: "t1", areaDetail: "愛知県エリア", fit: "○", expand: "△", siAmountM: 350, hasMaintenance: false, amountConfidence: "確定", maturityLevel: 5, owner: "福田", prefecture: "愛知県", department: null, lastUpdated: "2026/04/18" },
];

const DEFAULT_SALES_ORG_MASTER = [
  { section: "一課", members: ["岡崎", "梅村", "酒井", "矢野"] },
  { section: "二課", members: ["友田", "福田", "内田", "宇水", "竹内"] },
  { section: "三課", members: [] },
];
function sectionForOwner(owner, salesOrgMaster) {
  const row = salesOrgMaster.find((s) => s.members.includes(owner));
  return row ? row.section : "";
}
function formatM(amountM) {
  return `${amountM.toLocaleString()}M`;
}
function addMonths(y, m, offset) {
  const total = y * 12 + (m - 1) + offset;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
}
function fy(y, m) { return `${y}.${String(m).padStart(2, "0")}`; }
function computeTimeline(c, rank) {
  const [ly, lm] = c.lastUpdated.split("/").map(Number);
  const timeline = { proposal: null, order: null, kickoff: null, goLive: null };
  if (c.maturityLevel >= 4) {
    const p = addMonths(ly, lm, -1);
    timeline.proposal = fy(p.y, p.m);
  }
  if (c.maturityLevel === 5) {
    timeline.order = fy(ly, lm);
    if (rank === "A") {
      const k = addMonths(ly, lm, 1);
      const g = addMonths(ly, lm, 7);
      timeline.kickoff = fy(k.y, k.m);
      timeline.goLive = fy(g.y, g.m);
    }
  }
  // 人による修正（未定義なら自動算出値、null なら「－」、文字列なら手動指定値を優先）
  if (c.proposalDate !== undefined) timeline.proposal = c.proposalDate;
  if (c.orderDate !== undefined) timeline.order = c.orderDate;
  if (c.kickoffDate !== undefined) timeline.kickoff = c.kickoffDate;
  if (c.goLiveDate !== undefined) timeline.goLive = c.goLiveDate;
  return timeline;
}
let MONTH_OPTIONS_CACHE = null;
function generateMonthOptions() {
  if (MONTH_OPTIONS_CACHE) return MONTH_OPTIONS_CACHE;
  const now = new Date();
  const startYear = now.getFullYear() - 1;
  const endYear = REVENUE_PLAN_END_FY + 1;
  const options = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) options.push(fy(y, m));
  }
  MONTH_OPTIONS_CACHE = options;
  return options;
}
function computeRevenuePlan(amountM, thresholds, masters) {
  const cat = sizeCategory(amountM, thresholds); // 'large' | 'medium' | 'small' | 'none'
  const catLabel = sizeLabel(amountM, thresholds); // '大' | '中' | '小' | '対象外'
  const license = masters.licenseForecastMaster[cat] ?? 0;
  const maintenance = masters.maintenanceForecastMaster[cat] ?? 0;
  const durationMonths = masters.projectDurationMaster[cat] ?? 0;
  const phases = masters.revenuePhases.map((ph) => ({
    name: ph.name,
    months: Math.round(durationMonths * ph.durationRatio),
    amountM: Math.round(amountM * ph.amountRatio),
  }));
  return { category: cat, categoryLabel: catLabel, license, maintenance, durationMonths, phases };
}
function computeAdditionalDevStart(goLiveStr, rule) {
  if (!goLiveStr) return null;
  const [y, m] = goLiveStr.split(".").map(Number);
  const s = addMonths(y, m, rule.startAfterGoLiveMonths);
  return fy(s.y, s.m);
}

const COLOR_HEX = {
  red: "#ef4444", blue: "#3b82f6", emerald: "#10b981", amber: "#f59e0b",
  gray: "#9ca3af", purple: "#a855f7", teal: "#14b8a6", orange: "#f97316",
};
const REVENUE_PLAN_END_FY = 2030;

function computeMonthlyEvents(customer, additionalDevRule) {
  const events = [];
  const anchor = customer.timeline.order || customer.timeline.proposal;
  if (!anchor || !customer.revenuePlan.durationMonths) return events;
  const [ay, am] = anchor.split(".").map(Number);
  if (customer.revenuePlan.license) events.push({ y: ay, m: am, amount: customer.revenuePlan.license });

  let cy = ay, cm = am;
  customer.revenuePlan.phases.forEach((phase) => {
    const monthly = phase.months > 0 ? phase.amountM / phase.months : 0;
    for (let i = 0; i < phase.months; i++) {
      events.push({ y: cy, m: cm, amount: monthly });
      cm++; if (cm > 12) { cm = 1; cy++; }
    }
  });

  let goY = cy, goM = cm;
  if (customer.timeline.goLive) {
    const [gy, gm] = customer.timeline.goLive.split(".").map(Number);
    goY = gy; goM = gm;
  }
  if (customer.revenuePlan.maintenance) {
    let my = goY, mm = goM;
    while (fiscalYearOf(my, mm) <= REVENUE_PLAN_END_FY) {
      events.push({ y: my, m: mm, amount: customer.revenuePlan.maintenance });
      my += 1;
    }
  }
  let addY = goY, addM = goM + additionalDevRule.startAfterGoLiveMonths;
  while (addM > 12) { addM -= 12; addY += 1; }
  while (fiscalYearOf(addY, addM) <= REVENUE_PLAN_END_FY) {
    events.push({ y: addY, m: addM, amount: customer.revenuePlan.maintenance });
    addM += additionalDevRule.cycleMonths;
    while (addM > 12) { addM -= 12; addY += 1; }
  }
  return events;
}

function halfOf(m) { return (m >= 4 && m <= 9) ? 0 : 1; }
function getRevenueHalfPeriods() {
  const now = new Date();
  const startFY = fiscalYearOf(now.getFullYear(), now.getMonth() + 1);
  const startHalf = halfOf(now.getMonth() + 1);
  const periods = [];
  for (let fyYear = startFY; fyYear <= REVENUE_PLAN_END_FY; fyYear++) {
    for (let h = 0; h < 2; h++) {
      if (fyYear === startFY && h < startHalf) continue;
      periods.push({ fy: fyYear, half: h, label: `FY${fyYear}${h === 0 ? "上期" : "下期"}` });
    }
  }
  return periods;
}
function ymIndex(str) {
  const [y, m] = str.split(".").map(Number);
  return y * 12 + m;
}
function halfPeriodRange(p) {
  return p.half === 0
    ? { startIdx: p.fy * 12 + 4, endIdx: p.fy * 12 + 9 }
    : { startIdx: p.fy * 12 + 10, endIdx: (p.fy + 1) * 12 + 3 };
}
// PJ開始〜本番稼働の実期間、確定していなければ受注/提案日からプロジェクト期間分を見込みで算出
function computeProjectSpan(customer) {
  if (customer.timeline.kickoff && customer.timeline.goLive) {
    return { start: customer.timeline.kickoff, end: customer.timeline.goLive, estimated: false };
  }
  const anchor = customer.timeline.order || customer.timeline.proposal;
  if (!anchor || !customer.revenuePlan.durationMonths) return null;
  const [ay, am] = anchor.split(".").map(Number);
  const e = addMonths(ay, am, customer.revenuePlan.durationMonths);
  return { start: anchor, end: fy(e.y, e.m), estimated: true };
}
function computePolicyHalfYearTotals(customers, additionalDevRule, periods) {
  const totals = {};
  periods.forEach((p) => { totals[p.label] = {}; POLICY_OPTIONS.forEach((pol) => { totals[p.label][pol] = 0; }); });
  customers.forEach((c) => {
    const events = computeMonthlyEvents(c, additionalDevRule);
    events.forEach((e) => {
      const label = `FY${fiscalYearOf(e.y, e.m)}${halfOf(e.m) === 0 ? "上期" : "下期"}`;
      if (totals[label]) totals[label][c.policy] += e.amount;
    });
  });
  return totals;
}
function fiscalYearOf(y, m) { return m >= 4 ? y : y - 1; }
function getRevenueFiscalYears() {
  const now = new Date();
  const startFY = fiscalYearOf(now.getFullYear(), now.getMonth() + 1);
  const years = [];
  for (let y = startFY; y <= REVENUE_PLAN_END_FY; y++) years.push(y);
  return years;
}
function computeRevenueSchedule(customer, additionalDevRule, periods) {
  const result = {};
  periods.forEach((p) => { result[p.label] = { license: 0, dev: 0, maintenance: 0, additionalDev: 0 }; });
  const labelOf = (y, m) => `FY${fiscalYearOf(y, m)}${halfOf(m) === 0 ? "上期" : "下期"}`;
  const indexOf = (y, m) => fiscalYearOf(y, m) * 2 + halfOf(m);
  const anchor = customer.timeline.order || customer.timeline.proposal;
  if (!anchor || !customer.revenuePlan.durationMonths) return result;
  const [ay, am] = anchor.split(".").map(Number);

  const anchorLabel = labelOf(ay, am);
  if (result[anchorLabel]) result[anchorLabel].license += customer.revenuePlan.license;

  let cy = ay, cm = am;
  customer.revenuePlan.phases.forEach((phase) => {
    const monthly = phase.months > 0 ? phase.amountM / phase.months : 0;
    for (let i = 0; i < phase.months; i++) {
      const key = labelOf(cy, cm);
      if (result[key]) result[key].dev += monthly;
      cm++; if (cm > 12) { cm = 1; cy++; }
    }
  });

  let goY = cy, goM = cm;
  if (customer.timeline.goLive) {
    const [gy, gm] = customer.timeline.goLive.split(".").map(Number);
    goY = gy; goM = gm;
  }
  const lastPeriod = periods[periods.length - 1];
  const lastIdx = lastPeriod.fy * 2 + lastPeriod.half;

  if (customer.revenuePlan.maintenance) {
    let my = goY, mm = goM;
    while (indexOf(my, mm) <= lastIdx) {
      const key = labelOf(my, mm);
      if (result[key]) result[key].maintenance += customer.revenuePlan.maintenance;
      my += 1;
    }
  }

  let addY = goY, addM = goM + additionalDevRule.startAfterGoLiveMonths;
  while (addM > 12) { addM -= 12; addY += 1; }
  while (indexOf(addY, addM) <= lastIdx) {
    const key = labelOf(addY, addM);
    if (result[key]) result[key].additionalDev += customer.revenuePlan.maintenance; // 追加開発は年間保守見通しを目安額として使用
    addM += additionalDevRule.cycleMonths;
    while (addM > 12) { addM -= 12; addY += 1; }
  }

  return result;
}
function aggregateRevenueSchedules(customers, additionalDevRule, periods) {
  const total = {};
  periods.forEach((p) => { total[p.label] = { license: 0, dev: 0, maintenance: 0, additionalDev: 0 }; });
  customers.forEach((c) => {
    const sched = computeRevenueSchedule(c, additionalDevRule, periods);
    periods.forEach((p) => {
      total[p.label].license += sched[p.label].license;
      total[p.label].dev += sched[p.label].dev;
      total[p.label].maintenance += sched[p.label].maintenance;
      total[p.label].additionalDev += sched[p.label].additionalDev;
    });
  });
  return total;
}

const POLICY_SORT_ORDER = { 取り切る: 0, 攻める: 1, 育てる: 2, 見極める: 3, 見送る: 4 };
const TARGET_SORT_ORDER = { "ターゲット": 0, "チャレンジ": 1, "対象外": 2 };

function deriveCustomer(c, masters) {
  const industryGrade = gradeByIndustry(c.industry, masters.industryMaster);
  const sizeGrade = gradeBySize(c.revenue, c.companyType, masters.companySizeMaster);
  const areaGrade = gradeByArea(c.areaTierId, masters.areaMaster);
  const targetResultAuto = judgeTarget(industryGrade, sizeGrade, areaGrade);
  const isTargetException = !!c.targetException;
  const targetResult = isTargetException ? c.targetException : targetResultAuto;
  const profit = judgeProfitability(c.siAmountM, c.hasMaintenance, masters.sizeThresholds);
  const rank = judgeRank(c.fit, profit, c.expand);

  // 論点（取得情報・購買ステージ）の確認状況から成熟度Lvを逆算する
  const rawTopicData = c.topicData || defaultTopicData(c.maturityLevel || 1, masters.maturityItemMaster, c.id);
  const maturityStatuses = rawTopicData.map((t) => ({ ...t, status: clampStatusByEvidence(t.status, t.evidence) }));
  const maturityLevel = deriveMaturityLevel(maturityStatuses, masters.maturityItemMaster);

  const policy = masters.policyMatrix[rank][maturityLevel];
  const code = `${rank}${maturityLevel}`;
  const infoCompleteness = computeInfoCompleteness(maturityStatuses, masters.infoCompletenessMaster);
  const timing = proposalTiming(rank, maturityLevel);
  const salesSection = sectionForOwner(c.owner, masters.salesOrgMaster);
  const revenueStandalone = Math.round(c.revenue * (0.55 + ((c.id * 13) % 30) / 100));
  const timeline = computeTimeline({ ...c, maturityLevel }, rank);
  const revenuePlan = computeRevenuePlan(c.siAmountM, masters.sizeThresholds, masters);
  const additionalDevStart = computeAdditionalDevStart(timeline.goLive, masters.additionalDevRule);
  return {
    ...c, industryGrade, sizeGrade, areaGrade, targetResult, targetResultAuto, isTargetException, profit, rank, policy, code, maturityLevel,
    maturityStatuses, infoCompleteness, proposalTiming: timing, salesSection, revenueStandalone,
    timeline, revenuePlan, additionalDevStart,
  };
}

const HISTORY_TEMPLATES = {
  A: ["対象スコープにBOPを追加", "他工場展開の方針が明確化", "予算化が開始"],
  B: ["要件整理が進み評価基準が明確化", "推進体制にキーマンが加わった"],
  C: ["初回ヒアリングで課題感を確認", "継続フォローの接点を維持"],
  D: ["現時点では優先度を下げて記録のみ維持"],
};

/* ============================== 共通UIパーツ ============================== */

function GradeBadge({ grade, size = "sm" }) {
  const pad = size === "lg" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center justify-center rounded-md border font-semibold ${pad} ${GRADE_STYLE[grade] || "bg-gray-100 text-gray-500 border-gray-300"}`}>
      {grade}
    </span>
  );
}
function PolicyPill({ policy }) {
  const { policyColorMaster } = useMasters();
  const s = COLOR_PALETTE[policyColorMaster[policy]] || COLOR_PALETTE.gray;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${s.chip}`}>
      {policy}
    </span>
  );
}
function EvidenceTag({ type }) {
  return <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${EVIDENCE_STYLE[type]}`}>{type}</span>;
}
function Chip({ children }) {
  return <span className="inline-block rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-slate-500">{children}</span>;
}
const Card = React.forwardRef(function Card({ children, className = "" }, ref) {
  return <div ref={ref} className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>;
});

/* ============================== ナビゲーション ============================== */

function NavBar({ view, setView, onNavigate, saveState }) {
  const items = [
    { key: "dashboard", label: "ダッシュボード", icon: LayoutGrid },
    { key: "revenue", label: "売上計画", icon: TrendingUp },
    { key: "list", label: "アプローチリスト", icon: Users },
    { key: "review", label: "評価レビュー", icon: ClipboardCheck },
    { key: "framework", label: "考え方", icon: BookOpen },
    { key: "master", label: "マスター設定", icon: Settings },
  ];
  const saveLabel = { idle: "", saving: "保存中…", saved: "保存済み", error: "保存に失敗しました" }[saveState] || "";
  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2 overflow-x-auto">
        <span className="mr-3 whitespace-nowrap text-sm font-bold tracking-wide text-slate-700">PLM営業判断支援</span>
        {items.map((it) => {
          const Icon = it.icon;
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => (onNavigate ? onNavigate(it.key) : setView(it.key))}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={15} />
              {it.label}
            </button>
          );
        })}
        {saveLabel && (
          <span className={`ml-auto whitespace-nowrap text-xs ${saveState === "error" ? "text-red-500" : "text-slate-500"}`}>{saveLabel}</span>
        )}
      </div>
    </div>
  );
}

/* ============================== ダッシュボード ============================== */

function KpiCard({ label, value, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
        active ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:bg-slate-50"
      }`}
    >
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-xl font-bold text-slate-800">{value}</span>
    </button>
  );
}

function Dashboard({ customers, openCustomer, setView, setListFilter, selectedRevenueIds }) {
  const { policyMatrix, policyColorMaster, additionalDevRule } = useMasters();
  const [kpiFilter, setKpiFilter] = useState(null);

  const kpis = useMemo(() => ({
    total: customers.length,
    target: customers.filter((c) => c.targetResult === "ターゲット").length,
    pipeline: customers.reduce((s, c) => s + c.siAmountM, 0),
  }), [customers]);

  const policyBreakdown = useMemo(() => {
    return POLICY_OPTIONS.map((p) => ({ policy: p, count: customers.filter((c) => c.policy === p).length }));
  }, [customers]);

  const proposalCounts = useMemo(() => {
    const withTiming = customers.map((c) => ({ ...c, timing: proposalTiming(c.rank, c.maturityLevel) }));
    return {
      inProgress: withTiming.filter((c) => c.timing === "提案中").length,
      thisTerm: withTiming.filter((c) => c.timing === "今期予定").length,
      nextTerm: withTiming.filter((c) => c.timing === "来期予定").length,
    };
  }, [customers]);

  const matrix = useMemo(() => {
    const m = {};
    ["A", "B", "C", "D"].forEach((r) => { m[r] = {}; [1, 2, 3, 4, 5].forEach((l) => (m[r][l] = [])); });
    customers
      .filter((c) => c.targetResult !== "対象外" && !c.isSoftDeleted) // 対象外・削除（薄地）はターゲットマップに反映しない
      .forEach((c) => m[c.rank][c.maturityLevel].push(c));
    return m;
  }, [customers]);

  const applyKpi = (key) => {
    setKpiFilter(key === kpiFilter ? null : key);
    const map = {
      target: { targetResult: "ターゲット" },
      取り切る: { policy: "取り切る" }, 攻める: { policy: "攻める" }, 育てる: { policy: "育てる" },
      見極める: { policy: "見極める" }, 見送る: { policy: "見送る" },
      提案中: { proposalTiming: "提案中" }, 今期予定: { proposalTiming: "今期予定" }, 来期予定: { proposalTiming: "来期予定" },
    };
    if (map[key]) { setListFilter(map[key]); setView("list"); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">ダッシュボード</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KpiCard label="登録企業数" value={kpis.total} onClick={() => applyKpi("total")} />
        <KpiCard label="パイプライン金額" value={formatM(kpis.pipeline)} onClick={() => applyKpi("total")} />
        <div
          onClick={() => applyKpi("target")}
          className={`col-span-2 flex cursor-pointer flex-col gap-2 rounded-xl border p-3 text-left transition-colors sm:col-span-1 ${kpiFilter === "target" ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:bg-slate-50"}`}
        >
          <div>
            <span className="text-xs font-medium text-slate-500">ターゲット企業数</span>
            <div className="text-xl font-bold text-slate-800">{kpis.target}</div>
          </div>
          <div className="flex flex-wrap gap-1">
            {policyBreakdown.map(({ policy, count }) => {
              const s = COLOR_PALETTE[policyColorMaster[policy]] || COLOR_PALETTE.gray;
              return (
                <button key={policy} onClick={(e) => { e.stopPropagation(); applyKpi(policy); }} className={`rounded px-1.5 py-0.5 text-xs font-medium ${s.chip} hover:brightness-95`}>
                  {policy} {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base font-bold text-slate-700">ターゲットマップ・活動優先度</h2>
          <div className="flex flex-wrap gap-1.5">
            {POLICY_OPTIONS.map((p) => {
              const s = COLOR_PALETTE[policyColorMaster[p]] || COLOR_PALETTE.gray;
              return (
                <span key={p} className={`rounded px-2 py-1 text-xs font-semibold ${s.chip}`}>{p}</span>
              );
            })}
          </div>
        </div>
        <p className="mb-3 text-xs text-slate-500">ターゲット判定が「対象外」の企業、および削除（薄地表示）した企業は表示していません。</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-24 border-b border-gray-100 p-1 text-left align-bottom text-xs font-medium text-slate-500">適合度＼成熟度</th>
                {[1, 2, 3, 4, 5].map((l) => (
                  <th key={l} className="p-1 text-center text-xs font-medium text-slate-500">
                    Lv{l}
                    <div className="text-xs font-normal text-slate-500">
                      {["情報収集", "構想・方向性", "計画・予算化", "提案・比較検討", "最終選定・契約"][l - 1]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["A", "B", "C", "D"].map((r) => (
                <tr key={r}>
                  <td className="p-1 text-center text-sm font-bold text-slate-600">{r}</td>
                  {[1, 2, 3, 4, 5].map((l) => {
                    const cellCustomers = matrix[r][l];
                    const policy = policyMatrix[r][l];
                    const s = COLOR_PALETTE[policyColorMaster[policy]] || COLOR_PALETTE.gray;
                    return (
                      <td
                        key={l}
                        onClick={() => { setListFilter({ rank: r, maturityLevel: l }); setView("list"); }}
                        className={`min-w-[120px] cursor-pointer rounded-lg border p-1.5 align-top ${s.bg} ${s.border} hover:brightness-95`}
                      >
                        <div className="flex flex-wrap gap-1">
                          {cellCustomers.map((c) => (
                            <span
                              key={c.id}
                              onClick={(e) => { e.stopPropagation(); openCustomer(c.id); }}
                              title={`担当:${c.owner} / ${c.siAmountM}M / ${c.lastUpdated}`}
                              className={`rounded border bg-white px-1.5 py-0.5 text-xs font-medium ${s.text} border-current/20 hover:underline`}
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-700">売上計画</h2>
          <button onClick={() => setView("revenue")} className="text-xs font-medium text-indigo-600 hover:underline">対象企業を選ぶ・詳細を見る →</button>
        </div>
        <p className="mb-3 text-xs text-slate-500">「売上計画」タブで選択した企業（{selectedRevenueIds.length}社）の見通しを、上期（4-9月）・下期（10-3月）ごと・営業方針別に集計しています。凡例をクリックすると表示／非表示を切り替えられます。</p>
        <RevenueChart customers={customers.filter((c) => selectedRevenueIds.includes(c.id) && !c.isSoftDeleted)} additionalDevRule={additionalDevRule} policyColorMaster={policyColorMaster} />
      </Card>

      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-700">提案状況</h2>
          <span className="text-xs text-slate-500">期は4月〜3月（今期：{FISCAL_YEAR_LABELS.current}／来期：{FISCAL_YEAR_LABELS.next}）</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <KpiCard label="提案中" value={proposalCounts.inProgress} onClick={() => applyKpi("提案中")} active={kpiFilter === "提案中"} />
          <KpiCard label={`提案予定（今期：${FISCAL_YEAR_LABELS.current}）`} value={proposalCounts.thisTerm} onClick={() => applyKpi("今期予定")} active={kpiFilter === "今期予定"} />
          <KpiCard label={`提案予定（来期：${FISCAL_YEAR_LABELS.next}）`} value={proposalCounts.nextTerm} onClick={() => applyKpi("来期予定")} active={kpiFilter === "来期予定"} />
        </div>
      </Card>
    </div>
  );
}

/* ============================== 売上計画 ============================== */

function RevenueChart({ customers, additionalDevRule, policyColorMaster }) {
  const periods = useMemo(() => getRevenueHalfPeriods(), []);
  const totals = useMemo(() => computePolicyHalfYearTotals(customers, additionalDevRule, periods), [customers, additionalDevRule, periods]);
  const [hidden, setHidden] = useState(() => new Set());

  const data = periods.map((p) => {
    const row = { name: p.label };
    POLICY_OPTIONS.forEach((pol) => { row[pol] = Math.round(totals[p.label][pol]); });
    return row;
  });

  const togglePolicy = (pol) => {
    setHidden((s) => {
      const next = new Set(s);
      if (next.has(pol)) next.delete(pol); else next.add(pol);
      return next;
    });
  };

  const hasAnyData = data.some((row) => POLICY_OPTIONS.some((pol) => row[pol] > 0));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {POLICY_OPTIONS.map((pol) => {
          const s = COLOR_PALETTE[policyColorMaster[pol]] || COLOR_PALETTE.gray;
          const isHidden = hidden.has(pol);
          return (
            <button
              key={pol}
              onClick={() => togglePolicy(pol)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-opacity ${s.chip} ${isHidden ? "opacity-40" : ""}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {pol}
            </button>
          );
        })}
      </div>
      {hasAnyData ? (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}M`} />
              <Tooltip formatter={(v) => `${v}M`} />
              {POLICY_OPTIONS.map((pol) => (
                <Bar key={pol} dataKey={pol} stackId="a" hide={hidden.has(pol)} fill={COLOR_HEX[policyColorMaster[pol]] || COLOR_HEX.gray} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-xs text-slate-500">選択されている企業に、まだ受注・提案の見込みがありません</p>
      )}
    </div>
  );
}

function ProjectGantt({ customers, policyColorMaster }) {
  const periods = useMemo(() => getRevenueHalfPeriods(), []);
  const rows = useMemo(() => {
    return customers
      .map((c) => ({ c, span: computeProjectSpan(c) }))
      .filter((r) => r.span)
      .sort((a, b) => a.span.start.localeCompare(b.span.start));
  }, [customers]);

  const counts = useMemo(() => periods.map((p) => {
    const { startIdx, endIdx } = halfPeriodRange(p);
    return rows.filter(({ span }) => ymIndex(span.start) <= endIdx && ymIndex(span.end) >= startIdx).length;
  }), [periods, rows]);

  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-400">表示できるプロジェクト期間（PJ開始〜本番稼働、または受注・提案からの見込み期間）がある企業がありません</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-1 text-xs">
          <thead>
            <tr>
              <th className="w-36 text-left font-medium text-slate-500">会社名</th>
              {periods.map((p) => <th key={p.label} className="whitespace-nowrap px-1 text-center font-medium text-slate-500">{p.label}</th>)}
            </tr>
            <tr>
              <th className="text-left text-[11px] font-normal text-slate-400">同時進行数</th>
              {counts.map((n, i) => (
                <th key={i} className={`rounded px-1 py-1 text-center text-[11px] font-bold ${n >= 3 ? "bg-red-100 text-red-600" : n === 2 ? "bg-amber-100 text-amber-600" : n === 1 ? "bg-slate-100 text-slate-500" : "text-slate-300"}`}>
                  {n || ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, span }) => {
              const s = COLOR_PALETTE[policyColorMaster[c.policy]] || COLOR_PALETTE.gray;
              const spanStartIdx = ymIndex(span.start);
              const spanEndIdx = ymIndex(span.end);
              return (
                <tr key={c.id}>
                  <td className="truncate whitespace-nowrap pr-2 font-medium text-slate-600" title={c.name}>{c.name}</td>
                  {periods.map((p) => {
                    const { startIdx, endIdx } = halfPeriodRange(p);
                    const active = spanStartIdx <= endIdx && spanEndIdx >= startIdx;
                    return (
                      <td key={p.label} className="px-1 py-0.5">
                        <div className={`h-4 rounded ${active ? s.dot : "bg-gray-100"} ${active && span.estimated ? "opacity-50" : ""}`} title={active ? `${c.name}：${span.start}〜${span.end}${span.estimated ? "（見込み）" : ""}` : ""} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        バーはPJ開始〜本番稼働の期間（確定していない場合は受注・提案日からプロジェクト期間分の見込みを薄色で表示）。同じ列に複数の色があれば、その半期に案件が重なっています。「同時進行数」が2件以上の半期はリソース逼迫の目安として色付けしています。
      </p>
    </div>
  );
}

function RevenueTable({ customers, additionalDevRule }) {
  const periods = useMemo(() => getRevenueHalfPeriods(), []);
  const totals = useMemo(() => aggregateRevenueSchedules(customers, additionalDevRule, periods), [customers, additionalDevRule, periods]);

  const rows = [
    { key: "license", label: "ライセンス" },
    { key: "dev", label: "開発（要件定義＋システム開発）" },
    { key: "maintenance", label: "年間保守" },
    { key: "additionalDev", label: "追加開発" },
  ];

  const grandTotal = periods.reduce((s, p) => s + rows.reduce((rs, r) => rs + totals[p.label][r.key], 0), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="w-36 text-left text-slate-500"></th>
            {periods.map((p) => <th key={p.label} className="whitespace-nowrap px-1 text-center font-medium text-slate-500">{p.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="truncate whitespace-nowrap pr-2 text-slate-500">{r.label}</td>
              {periods.map((p) => (
                <td key={p.label} className="rounded bg-slate-50 px-1 py-1.5 text-center text-slate-700">
                  {totals[p.label][r.key] ? formatM(Math.round(totals[p.label][r.key])) : "－"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="whitespace-nowrap pr-2 pt-1 font-bold text-slate-700">合計</td>
            {periods.map((p) => {
              const t = Math.round(rows.reduce((s, r) => s + totals[p.label][r.key], 0));
              return <td key={p.label} className="rounded bg-indigo-50 px-1 py-1.5 pt-1 text-center font-bold text-indigo-700">{t ? formatM(t) : "－"}</td>;
            })}
          </tr>
        </tfoot>
      </table>
      {grandTotal === 0 && <p className="mt-2 text-center text-xs text-slate-500">選択されている企業に、まだ受注・提案の見込みがありません</p>}
    </div>
  );
}

function RevenuePlanScreen({ customers, selectedRevenueIds, setSelectedRevenueIds }) {
  const { additionalDevRule, policyColorMaster } = useMasters();
  const [keyword, setKeyword] = useState("");

  const selectableCustomers = customers.filter((c) => !c.isSoftDeleted);
  const toggle = (id) => setSelectedRevenueIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const selectAll = () => setSelectedRevenueIds(selectableCustomers.filter((c) => c.targetResult !== "対象外").map((c) => c.id));
  const selectNone = () => setSelectedRevenueIds([]);

  const visible = selectableCustomers.filter((c) => !keyword || c.name.includes(keyword));
  const selectedCustomers = selectableCustomers.filter((c) => selectedRevenueIds.includes(c.id));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">売上計画</h1>
        <p className="text-sm text-slate-500">対象企業を選択すると、下の見通しに反映されます（同じ表がダッシュボードにも表示されます）。期間は{getRevenueFiscalYears()[0]}年度〜{REVENUE_PLAN_END_FY}年度です。</p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-base font-bold text-slate-700">売上見通し（選択企業の合算）</h2>
        <RevenueTable customers={selectedCustomers} additionalDevRule={additionalDevRule} />
      </Card>
      <p className="text-xs text-slate-500">
        算出ロジック：受注（なければ提案）月を起点に、要件定義（期間25%・金額20%）→システム開発（期間75%・金額80%）の順で月割り計上。保守は本番稼働年度から毎年、追加開発は本番稼働の{additionalDevRule.startAfterGoLiveMonths}ヶ月後から{additionalDevRule.cycleMonths}ヶ月ごとに計上（金額は年間保守見通しを目安額として使用）。各前提は「⑥収益計画」マスターで編集できます。
      </p>

      <Card className="p-4">
        <h2 className="mb-3 text-base font-bold text-slate-700">プロジェクト計画見通し（選択企業）</h2>
        <ProjectGantt customers={selectedCustomers} policyColorMaster={policyColorMaster} />
      </Card>

      <Card className="p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-600">対象企業（{selectedRevenueIds.length}/{selectableCustomers.length}）</span>
          <div className="flex items-center gap-3">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="会社名で検索" className="rounded border border-gray-200 px-2 py-1 text-sm" />
            <button onClick={selectAll} className="text-xs text-indigo-600 hover:underline">全選択</button>
            <button onClick={selectNone} className="text-xs text-slate-500 hover:underline">全解除</button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="w-8 px-2 py-2"></th>
                <th className="px-2 py-2">会社名</th>
                <th className="px-2 py-2">ランク</th>
                <th className="px-2 py-2">提案</th>
                <th className="px-2 py-2">受注</th>
                <th className="px-2 py-2">PJ開始</th>
                <th className="px-2 py-2">本番稼働</th>
                <th className="px-2 py-2">案件規模（SI金額）</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`cursor-pointer border-b border-gray-50 last:border-0 ${selectedRevenueIds.includes(c.id) ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                >
                  <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedRevenueIds.includes(c.id)} onChange={() => toggle(c.id)} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-medium text-slate-700">{c.name}</td>
                  <td className="px-2 py-1.5"><span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">{c.code}</span></td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-500">{c.timeline.proposal || "－"}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-500">{c.timeline.order || "－"}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-500">{c.timeline.kickoff || "－"}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-500">{c.timeline.goLive || "－"}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-medium text-slate-700">{formatM(c.siAmountM)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================== 顧客一覧 ============================== */

function SortHeader({ label, sortKey, currentKey, currentDir, onSort }) {
  const active = currentKey === sortKey;
  return (
    <th className="px-3 py-2">
      <button onClick={() => onSort(sortKey)} className={`flex items-center gap-0.5 whitespace-nowrap font-medium ${active ? "text-slate-700" : "text-slate-500 hover:text-slate-600"}`}>
        {label}
        {active ? (currentDir === "asc" ? <ChevronDown size={12} className="rotate-180" /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-0" />}
      </button>
    </th>
  );
}

function TimelineSelect({ value, onChange }) {
  const options = generateMonthOptions();
  return (
    <select
      value={value || ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded border border-transparent bg-transparent px-1 py-0.5 text-slate-500 hover:border-gray-200 focus:border-indigo-300"
    >
      <option value="">－</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SortHeaderInner({ label, sortKey, currentKey, currentDir, onSort }) {
  const active = currentKey === sortKey;
  return (
    <button onClick={() => onSort(sortKey)} className={`flex items-center gap-0.5 whitespace-nowrap font-medium ${active ? "text-slate-700" : "text-slate-500 hover:text-slate-600"}`}>
      {label}
      {active ? (currentDir === "asc" ? <ChevronDown size={12} className="rotate-180" /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-0" />}
    </button>
  );
}

const SIZE_SORT_ORDER = { "小": 0, "中": 1, "大": 2, "対象外": 3 };

function CustomerList({ customers, openCustomer, filter, setFilter, updateCustomer, addCustomer, deleteCustomer, reviveCustomer }) {
  const { policyColorMaster, industryMaster, salesOrgMaster, areaMaster } = useMasters();
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortValue = (c, key) => {
    switch (key) {
      case "targetResult": return TARGET_SORT_ORDER[c.targetResult] ?? 99;
      case "policy": return POLICY_SORT_ORDER[c.policy] ?? 99;
      case "code": return `${c.rank}${c.maturityLevel}`;
      case "salesSection": return c.salesSection || "";
      case "owner": return c.owner || "";
      case "prefecture": return c.prefecture || "";
      case "name": return c.name || "";
      case "department": return c.department || "";
      case "industry": return c.industry || "";
      case "revenue": return c.revenue;
      case "revenueStandalone": return c.revenueStandalone;
      case "siAmount": return c.siAmountM;
      case "sizeCategory": return SIZE_SORT_ORDER[c.revenuePlan.categoryLabel] ?? 99;
      case "license": return c.revenuePlan.license;
      case "maintenance": return c.revenuePlan.maintenance;
      case "proposal": return c.timeline.proposal || "";
      case "order": return c.timeline.order || "";
      case "kickoff": return c.timeline.kickoff || "";
      case "goLive": return c.timeline.goLive || "";
      case "additionalDevStart": return c.additionalDevStart || "";
      case "lastUpdated": return c.lastUpdated || "";
      default: return "";
    }
  };

  const filtered = customers.filter((c) => {
    if (keyword && !c.name.includes(keyword)) return false;
    if (filter.rank && c.rank !== filter.rank) return false;
    if (filter.maturityLevel && c.maturityLevel !== filter.maturityLevel) return false;
    if (filter.targetResult && c.targetResult !== filter.targetResult) return false;
    if (filter.policy && c.policy !== filter.policy) return false;
    if (filter.infoCompleteness && c.infoCompleteness !== filter.infoCompleteness) return false;
    if (filter.proposalTiming && c.proposalTiming !== filter.proposalTiming) return false;
    if (filter.salesSection && c.salesSection !== filter.salesSection) return false;
    return true;
  });

  const compareBy = (a, b) => {
    const va = sortValue(a, sortKey);
    const vb = sortValue(b, sortKey);
    let cmp;
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
    else cmp = String(va).localeCompare(String(vb), "ja");
    if (cmp === 0) cmp = a.name.localeCompare(b.name, "ja");
    return sortDir === "asc" ? cmp : -cmp;
  };

  // 基本は営業方針（取り切る→攻める→育てる→見極める→見送る）でグループ化し、
  // グループ内を選択した列で並べ替える（同じタブ＝同じ営業方針の中でソート）
  const groups = POLICY_OPTIONS.map((policy) => ({
    policy,
    rows: filtered.filter((c) => c.policy === policy).sort(compareBy),
  })).filter((g) => g.rows.length > 0);

  const totalCount = filtered.length;
  const filterChips = Object.entries(filter).filter(([, v]) => v);

  const stickyLeft = { targetResult: 0, policy: 56, code: 152, section: 216, owner: 272, prefecture: 328 };
  const nameLeft = 408;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">アプローチリスト</h1>
        <span className="text-xs text-slate-500">{totalCount} / {customers.length} 件</span>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5">
          <Search size={14} className="text-slate-500" />
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="会社名で検索" className="w-40 text-sm outline-none placeholder:text-slate-500" />
        </div>
        <select value={filter.rank || ""} onChange={(e) => setFilter((f) => ({ ...f, rank: e.target.value || undefined }))} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-slate-600">
          <option value="">適合度：すべて</option>
          {["A", "B", "C", "D"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filter.targetResult || ""} onChange={(e) => setFilter((f) => ({ ...f, targetResult: e.target.value || undefined }))} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-slate-600">
          <option value="">ターゲット判定：すべて</option>
          {["ターゲット", "チャレンジ", "対象外"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filter.policy || ""} onChange={(e) => setFilter((f) => ({ ...f, policy: e.target.value || undefined }))} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-slate-600">
          <option value="">営業方針：すべて</option>
          {POLICY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filter.salesSection || ""} onChange={(e) => setFilter((f) => ({ ...f, salesSection: e.target.value || undefined }))} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-slate-600">
          <option value="">担当課：すべて</option>
          {["一課", "二課", "三課"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-500">列見出しでグループ内を並べ替えられます／セルは直接クリックして編集できます</span>
        <button
          onClick={() => openCustomer(addCustomer())}
          className="flex items-center gap-1 rounded-lg border border-dashed border-indigo-300 px-2 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          ＋ 新規追加
        </button>
        {filterChips.length > 0 && (
          <button onClick={() => setFilter({})} className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-600">
            <X size={12} /> 絞り込みをクリア（{filterChips.map(([k]) => k).join("、")}）
          </button>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[2000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="sticky top-0 z-20 w-14 bg-slate-50 px-3 py-2" style={{ left: stickyLeft.targetResult, position: "sticky" }}>
                  <SortHeaderInner label="判定" sortKey="targetResult" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="sticky top-0 z-20 w-24 bg-slate-50 px-3 py-2" style={{ left: stickyLeft.policy, position: "sticky" }}>
                  <SortHeaderInner label="営業方針" sortKey="policy" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="sticky top-0 z-20 w-16 bg-slate-50 px-3 py-2" style={{ left: stickyLeft.code, position: "sticky" }}>
                  <SortHeaderInner label="ランク" sortKey="code" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="sticky top-0 z-20 w-14 bg-slate-50 px-3 py-2" style={{ left: stickyLeft.section, position: "sticky" }}>
                  <SortHeaderInner label="担当課" sortKey="salesSection" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="sticky top-0 z-20 w-14 bg-slate-50 px-3 py-2" style={{ left: stickyLeft.owner, position: "sticky" }}>
                  <SortHeaderInner label="担当者" sortKey="owner" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="sticky top-0 z-20 w-20 bg-slate-50 px-3 py-2" style={{ left: stickyLeft.prefecture, position: "sticky" }}>
                  <SortHeaderInner label="エリア" sortKey="prefecture" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="sticky top-0 z-30 w-32 border-r border-gray-200 bg-slate-50 px-3 py-2 shadow-[2px_0_4px_rgba(0,0,0,0.05)]" style={{ left: nameLeft, position: "sticky" }}>
                  <SortHeaderInner label="会社名" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="事業部" sortKey="department" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="業種" sortKey="industry" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="年間売上（連結）" sortKey="revenue" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="年間売上（単独）" sortKey="revenueStandalone" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="案件規模（SI金額）" sortKey="siAmount" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="規模区分" sortKey="sizeCategory" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="ライセンス見通し" sortKey="license" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="年間保守見通し" sortKey="maintenance" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="提案" sortKey="proposal" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="受注" sortKey="order" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="PJ開始" sortKey="kickoff" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="本番稼働" sortKey="goLive" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="追加開発開始" sortKey="additionalDevStart" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2"><SortHeaderInner label="最終コンタクト" sortKey="lastUpdated" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                <th className="sticky top-0 z-10 w-10 bg-slate-50 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const style = COLOR_PALETTE[policyColorMaster[g.policy]] || COLOR_PALETTE.gray;
                return (
                  <React.Fragment key={g.policy}>
                    <tr>
                      <td colSpan={22} className={`px-3 py-1 text-xs font-bold ${style.bg} ${style.text}`}>{g.policy}（{g.rows.length}件）</td>
                    </tr>
                    {g.rows.map((c) => (
                      <tr key={c.id} onClick={() => openCustomer(c.id)} className={`cursor-pointer border-b border-gray-50 last:border-0 hover:bg-slate-50 ${c.isSoftDeleted ? "opacity-40 grayscale" : ""}`}>
                        <td className="bg-white px-3 py-2" style={{ left: stickyLeft.targetResult, position: "sticky" }}>
                          <GradeBadge grade={TARGET_MARK[c.targetResult]} />
                          {c.isTargetException && <span className="ml-0.5 text-xs text-amber-500" title="例外適用中">※</span>}
                        </td>
                        <td className="bg-white px-3 py-2" style={{ left: stickyLeft.policy, position: "sticky" }}><PolicyPill policy={c.policy} /></td>
                        <td className="bg-white px-3 py-2" style={{ left: stickyLeft.code, position: "sticky" }}>
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">{c.code}</span>
                        </td>
                        <td className="whitespace-nowrap bg-white px-3 py-2 text-slate-500" style={{ left: stickyLeft.section, position: "sticky" }}>{c.salesSection}</td>
                        <td className="whitespace-nowrap bg-white px-2 py-1.5" style={{ left: stickyLeft.owner, position: "sticky" }} onClick={(e) => e.stopPropagation()}>
                          <select value={c.owner} onChange={(e) => updateCustomer(c.id, { owner: e.target.value })} className="w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-slate-600 hover:border-gray-200 focus:border-indigo-300">
                            {salesOrgMaster.flatMap((s) => s.members).map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="whitespace-nowrap bg-white px-2 py-1.5" style={{ left: stickyLeft.prefecture, position: "sticky" }} onClick={(e) => e.stopPropagation()}>
                          <input value={c.prefecture} onChange={(e) => updateCustomer(c.id, { prefecture: e.target.value })} className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-slate-600 hover:border-gray-200 focus:border-indigo-300" />
                        </td>
                        <td className="whitespace-nowrap border-r border-gray-100 bg-white px-2 py-1.5 font-medium text-indigo-600 shadow-[2px_0_4px_rgba(0,0,0,0.03)]" style={{ left: nameLeft, position: "sticky" }} onClick={(e) => e.stopPropagation()}>
                          <input value={c.name} onChange={(e) => updateCustomer(c.id, { name: e.target.value })} className="w-32 rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-indigo-600 hover:border-gray-200 focus:border-indigo-300" />
                          {c.isSoftDeleted && <span className="ml-1 rounded bg-gray-200 px-1 py-0.5 text-[10px] font-bold text-gray-500">削除済</span>}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                          <input value={c.department || ""} onChange={(e) => updateCustomer(c.id, { department: e.target.value || null })} placeholder="－" className="w-28 rounded border border-transparent bg-transparent px-1 py-0.5 text-slate-500 hover:border-gray-200 focus:border-indigo-300" />
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                          <select value={c.industry} onChange={(e) => updateCustomer(c.id, { industry: e.target.value })} className="rounded border border-transparent bg-transparent px-1 py-0.5 text-slate-500 hover:border-gray-200 focus:border-indigo-300">
                            {industryMaster.map((i) => <option key={i.name} value={i.name}>{i.name}</option>)}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                          <input type="number" value={c.revenue} onChange={(e) => updateCustomer(c.id, { revenue: Number(e.target.value) || 0 })} className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-slate-500 hover:border-gray-200 focus:border-indigo-300" />億円
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{c.revenueStandalone.toLocaleString()}億円</td>
                        <td className="whitespace-nowrap px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                          <input type="number" step="50" value={c.siAmountM} onChange={(e) => updateCustomer(c.id, { siAmountM: Number(e.target.value) || 0 })} className="w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-right font-medium text-slate-700 hover:border-gray-200 focus:border-indigo-300" />M
                        </td>
                        <td className="whitespace-nowrap px-3 py-2"><GradeBadge grade={{ "小": "△", "中": "○", "大": "◎", "対象外": "✕" }[c.revenuePlan.categoryLabel]} /> <span className="ml-1 text-xs text-slate-500">{c.revenuePlan.categoryLabel}</span></td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{c.revenuePlan.license ? formatM(c.revenuePlan.license) : "－"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{c.revenuePlan.maintenance ? formatM(c.revenuePlan.maintenance) : "－"}</td>
                        <td className="whitespace-nowrap px-1 py-1.5 text-slate-500"><TimelineSelect value={c.timeline.proposal} onChange={(v) => updateCustomer(c.id, { proposalDate: v })} /></td>
                        <td className="whitespace-nowrap px-1 py-1.5 text-slate-500"><TimelineSelect value={c.timeline.order} onChange={(v) => updateCustomer(c.id, { orderDate: v })} /></td>
                        <td className="whitespace-nowrap px-1 py-1.5 text-slate-500"><TimelineSelect value={c.timeline.kickoff} onChange={(v) => updateCustomer(c.id, { kickoffDate: v })} /></td>
                        <td className="whitespace-nowrap px-1 py-1.5 text-slate-500"><TimelineSelect value={c.timeline.goLive} onChange={(v) => updateCustomer(c.id, { goLiveDate: v })} /></td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{c.additionalDevStart || "－"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{c.lastUpdated}</td>
                        <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {c.isSoftDeleted && (
                              <button
                                onClick={() => reviveCustomer(c.id)}
                                className="text-slate-300 hover:text-emerald-500"
                                title="復活"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteCustomer(c.id)}
                              className="text-slate-300 hover:text-red-500"
                              title={c.isSoftDeleted ? "もう一度押すと完全に削除します（元に戻せません）" : "削除（薄地表示になり、もう一度押すと完全削除）"}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              {totalCount === 0 && <tr><td colSpan={22} className="px-3 py-8 text-center text-sm text-slate-500">該当する顧客がありません</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================== 顧客カルテ ============================== */

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${active === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

function ExpandableCard({ title, grade, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-left">
        <span className="text-sm font-bold text-slate-700">{title}</span>
        <div className="flex items-center gap-2">
          <GradeBadge grade={grade} size="lg" />
          {open ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
        </div>
      </button>
      {open && <div className="border-t border-gray-100 p-4">{children}</div>}
    </Card>
  );
}

function CustomerKarte({ customer, updateCustomer, back }) {
  const { sizeThresholds, policyMatrix, companySizeMaster, areaMaster, issueAttributeMaster, scopeMaster, productCharMaster, expansionTypeMaster, infoCompletenessMaster, licenseForecastMaster, maintenanceForecastMaster, projectDurationMaster, revenuePhases, additionalDevRule, maturityItemMaster } = useMasters();
  const [tab, setTab] = useState("概要");
  const items = customer.maturityStatuses;
  const totalStatuses = items.filter((i) => i.status === "明確" || i.status === "合意済み").length;

  const [amount, setAmount] = useState(customer.siAmountM);
  const [maintenance, setMaintenance] = useState(customer.hasMaintenance);
  const [fit, setFit] = useState(customer.fit);
  const [expand, setExpand] = useState(customer.expand);
  const liveProfit = judgeProfitability(amount, maintenance, sizeThresholds);
  const liveRank = judgeRank(fit, liveProfit, expand);
  const livePolicy = policyMatrix[liveRank][customer.maturityLevel];
  const liveCode = `${liveRank}${customer.maturityLevel}`;
  const changed = liveRank !== customer.rank;
  const liveRevenuePlan = computeRevenuePlan(amount, sizeThresholds, { licenseForecastMaster, maintenanceForecastMaster, projectDurationMaster, revenuePhases });

  const applyRecalc = () => updateCustomer(customer.id, { siAmountM: amount, hasMaintenance: maintenance, fit, expand });

  const sizeMasterRow = companySizeMaster[customer.companyType];
  const updateAreaTier = (id) => updateCustomer(customer.id, { areaTierId: id });

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <button onClick={back} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> アプローチリストに戻る
      </button>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">{customer.name}</h1>
              <span className="rounded-lg bg-slate-800 px-3 py-1 font-mono text-lg font-bold text-white">{customer.code}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              案件価値 {customer.rank}｜成熟度 Lv{customer.maturityLevel}｜担当：{customer.owner}｜最終更新：{customer.lastUpdated}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PolicyPill policy={customer.policy} />
            <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${GRADE_STYLE[TARGET_MARK[customer.targetResult]]}`}>
              ターゲット判定：{TARGET_MARK[customer.targetResult]} {customer.targetResult}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="px-4 pt-2"><Tabs tabs={["概要", "ターゲット判定", "案件評価", "成熟度", "評価履歴", "情報ソース"]} active={tab} onChange={setTab} /></div>
        <div className="p-5">

          {tab === "概要" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-xs font-bold text-slate-500">会社情報</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between border-b border-gray-50 py-1"><dt className="text-slate-500">業種</dt><dd className="text-slate-700">{customer.industry}</dd></div>
                    <div className="flex items-center justify-between border-b border-gray-50 py-1">
                      <dt className="text-slate-500">区分</dt>
                      <dd>
                        <select
                          value={customer.companyType}
                          onChange={(e) => {
                            const nextType = e.target.value;
                            updateCustomer(customer.id, { companyType: nextType, isToyotaGroup: nextType === "部品メーカー・トヨタ系" });
                          }}
                          className="rounded border border-gray-200 px-2 py-1 text-sm text-slate-700"
                        >
                          <option value="部品メーカー・トヨタ系">部品メーカー・トヨタ系</option>
                          <option value="部品メーカー・その他">部品メーカー・その他</option>
                          <option value="完成品メーカー">完成品メーカー</option>
                        </select>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 py-1">
                      <dt className="text-slate-500">トヨタ系該当</dt>
                      <dd>
                        <label className="flex items-center gap-1.5 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={customer.isToyotaGroup}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const patch = { isToyotaGroup: checked };
                              if (customer.companyType === "部品メーカー・トヨタ系" || customer.companyType === "部品メーカー・その他") {
                                patch.companyType = checked ? "部品メーカー・トヨタ系" : "部品メーカー・その他";
                              }
                              updateCustomer(customer.id, patch);
                            }}
                          />
                          {customer.isToyotaGroup ? "該当あり" : "該当なし"}
                        </label>
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 py-1"><dt className="text-slate-500">売上高</dt><dd className="text-slate-700">{customer.revenue.toLocaleString()}億円</dd></div>
                    <div className="flex justify-between py-1"><dt className="flex items-center gap-1 text-slate-500"><MapPin size={12} />エリア</dt><dd className="text-slate-700">{customer.areaDetail}</dd></div>
                  </dl>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-bold text-slate-500">評価サマリー</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex items-center justify-between border-b border-gray-50 py-1"><dt className="text-slate-500">ハマるか</dt><dd><GradeBadge grade={customer.fit} /></dd></div>
                    <div className="flex items-center justify-between border-b border-gray-50 py-1"><dt className="text-slate-500">儲かるか</dt><dd><GradeBadge grade={customer.profit} /></dd></div>
                    <div className="flex items-center justify-between border-b border-gray-50 py-1"><dt className="text-slate-500">広がるか</dt><dd><GradeBadge grade={customer.expand} /></dd></div>
                    <div className="flex items-center justify-between border-b border-gray-50 py-1"><dt className="text-slate-500">案件価値</dt><dd className="font-bold text-slate-700">{customer.rank}</dd></div>
                    <div className="flex items-center justify-between border-b border-gray-50 py-1"><dt className="text-slate-500">成熟度</dt><dd className="font-bold text-slate-700">Lv{customer.maturityLevel}</dd></div>
                    <div className="flex items-center justify-between py-1"><dt className="text-slate-500">営業方針</dt><dd><PolicyPill policy={customer.policy} /></dd></div>
                  </dl>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <h3 className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-500"><Info size={12} />現在地と不足事項</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>・明確になっている事項：{items.filter((i) => i.status === "明確" || i.status === "合意済み").map((i) => i.name).join("、") || "なし"}</li>
                  <li>・検討中の事項：{items.filter((i) => i.status === "整理中").map((i) => i.name).join("、") || "なし"}</li>
                  <li>・未確認事項：{items.filter((i) => i.status === "未確認" || i.status === "未着手").map((i) => i.name).join("、") || "なし"}</li>
                  {customer.infoCompleteness !== "十分" && <li className="flex items-center gap-1 text-amber-600"><AlertCircle size={12} />評価に必要な情報が一部不足しています（情報充足度：{customer.infoCompleteness}）</li>}
                </ul>
              </div>
            </div>
          )}

          {tab === "ターゲット判定" && (
            <div className="space-y-3">
              <div className="flex items-start justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">業種</p>
                  <p className="text-xs text-slate-500">{customer.industry}</p>
                  <p className="mt-1 text-xs text-slate-500">出所：業種マスター</p>
                </div>
                <GradeBadge grade={customer.industryGrade} size="lg" />
              </div>
              <div className="flex items-start justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">企業規模</p>
                  <p className="text-xs text-slate-500">連結売上高 {customer.revenue.toLocaleString()}億円（{customer.companyType}）</p>
                  {sizeMasterRow && (
                    <p className="mt-1 text-xs text-slate-500">
                      企業規模マスター適用：◎{sizeMasterRow.great}億円以上／○{sizeMasterRow.good}億円以上／△{sizeMasterRow.fair}億円以上
                    </p>
                  )}
                </div>
                <GradeBadge grade={customer.sizeGrade} size="lg" />
              </div>
              <div className="flex items-start justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">エリア</p>
                  <p className="text-xs text-slate-500">{customer.areaDetail}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs text-slate-500">出所：エリアマスター／区分を修正：</span>
                    <select value={customer.areaTierId} onChange={(e) => updateAreaTier(e.target.value)} className="rounded border border-gray-200 px-1 py-0.5 text-xs">
                      {areaMaster.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>
                </div>
                <GradeBadge grade={customer.areaGrade} size="lg" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">自動判定</p>
                  <p className="text-xs text-slate-500">
                    {customer.targetResultAuto === "対象外" ? "いずれかの項目が✕のため対象外" : customer.targetResultAuto === "チャレンジ" ? "✕はないが△を含むためチャレンジ" : "すべて◎・○のためターゲット"}
                  </p>
                </div>
                <span className={`rounded-md border px-3 py-1.5 text-base font-bold ${GRADE_STYLE[TARGET_MARK[customer.targetResultAuto]]}`}>
                  {TARGET_MARK[customer.targetResultAuto]} {customer.targetResultAuto}
                </span>
              </div>

              <div className={`rounded-lg border p-3 ${customer.isTargetException ? "border-amber-300 bg-amber-50" : "border-gray-100"}`}>
                <p className="mb-2 text-sm font-bold text-slate-700">例外処理</p>
                <p className="mb-2 text-xs text-slate-500">自動判定によらず、営業上の判断でターゲット判定を上書きしたい場合に使用します（例：基準未達だが戦略的に追う／基準達成だが対象外にする、など）。</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={customer.targetException || ""}
                    onChange={(e) => updateCustomer(customer.id, { targetException: e.target.value || null })}
                    className="rounded border border-gray-200 px-2 py-1 text-sm"
                  >
                    <option value="">自動判定を使う</option>
                    <option value="ターゲット">例外：ターゲット</option>
                    <option value="チャレンジ">例外：チャレンジ</option>
                    <option value="対象外">例外：対象外</option>
                  </select>
                  {customer.isTargetException && (
                    <input
                      value={customer.targetExceptionReason || ""}
                      onChange={(e) => updateCustomer(customer.id, { targetExceptionReason: e.target.value })}
                      placeholder="例外とする理由を入力"
                      className="min-w-[200px] flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-indigo-50 p-3">
                <div>
                  <p className="text-sm font-bold text-indigo-800">最終判定{customer.isTargetException && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">例外適用中</span>}</p>
                  <p className="text-xs text-indigo-500">
                    {customer.isTargetException
                      ? `自動判定は${customer.targetResultAuto}ですが、例外処理により${customer.targetResult}として扱います。${customer.targetExceptionReason ? `（理由：${customer.targetExceptionReason}）` : ""}`
                      : (customer.targetResult === "対象外" ? "いずれかの項目が✕のため対象外" : customer.targetResult === "チャレンジ" ? "✕はないが△を含むためチャレンジ" : "すべて◎・○のためターゲット")}
                  </p>
                </div>
                <span className={`rounded-md border px-3 py-1.5 text-lg font-bold ${GRADE_STYLE[TARGET_MARK[customer.targetResult]]}`}>
                  {TARGET_MARK[customer.targetResult]} {customer.targetResult}
                </span>
              </div>
            </div>
          )}

          {tab === "案件評価" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <ExpandableCard title="ハマるか" grade={fit}>
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>評価（人による修正）</span>
                      <select value={fit} onChange={(e) => setFit(e.target.value)} className="rounded border border-gray-200 px-2 py-1 text-sm font-semibold">
                        {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <ul className="space-y-1.5">
                      <li>・案件の目的：{customer.industry}領域での業務改革・情報活用の要望 <EvidenceTag type="営業仮説" /></li>
                      <li>・対象スコープ：E-BOM/BOPを中心とした中核業務領域 <EvidenceTag type="事実" /></li>
                      <li>・製品特性：{customer.companyType}特有の構成・変更頻度を考慮 <EvidenceTag type="AI仮説" /></li>
                    </ul>
                    <div>
                      <p className="mb-1 font-semibold text-slate-500">該当する課題属性（課題属性マスター）</p>
                      <div className="flex flex-wrap gap-1">{issueAttributeMaster.map((a) => <Chip key={a.name}>{a.name}</Chip>)}</div>
                    </div>
                    <div>
                      <p className="mb-1 font-semibold text-slate-500">対象スコープ（対象スコープマスター）</p>
                      <div className="flex flex-wrap gap-1">{scopeMaster.map((s) => <Chip key={s.name}>{s.name}</Chip>)}</div>
                    </div>
                    <div>
                      <p className="mb-1 font-semibold text-slate-500">製品特性の着目点（製品特性マスター）</p>
                      <div className="flex flex-wrap gap-1">{productCharMaster.map((p) => <Chip key={p.name}>{p.name}</Chip>)}</div>
                    </div>
                  </div>
                </ExpandableCard>
                <ExpandableCard title="儲かるか" grade={liveProfit}>
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>案件規模（SI金額）</span>
                      <div className="flex items-center gap-1">
                        <input type="number" step="50" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-24 rounded border border-gray-200 px-2 py-1 text-right text-sm" />
                        <span>M</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>保守・継続収益</span>
                      <label className="flex items-center gap-1.5"><input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />あり</label>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                      <span>規模区分</span><span className="font-semibold text-slate-700">{liveRevenuePlan.categoryLabel}</span>
                    </div>
                    <p className="text-xs text-slate-500">案件規模マスター：大{sizeThresholds.large}M以上／中{sizeThresholds.medium}M以上／小{sizeThresholds.small}M以上（50M単位）</p>
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2">
                      <div>ライセンス見通し：<b className="text-slate-700">{liveRevenuePlan.license ? formatM(liveRevenuePlan.license) : "－"}</b></div>
                      <div>年間保守見通し：<b className="text-slate-700">{liveRevenuePlan.maintenance ? formatM(liveRevenuePlan.maintenance) : "－"}</b></div>
                      <div>プロジェクト期間：<b className="text-slate-700">{liveRevenuePlan.durationMonths ? `${liveRevenuePlan.durationMonths}ヶ月` : "－"}</b></div>
                    </div>
                    {liveRevenuePlan.durationMonths > 0 && (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-500">売上計上フェーズ</p>
                        {liveRevenuePlan.phases.map((ph) => (
                          <div key={ph.name} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1">
                            <span>{ph.name}</span>
                            <span className="text-slate-500">{ph.months}ヶ月／{formatM(ph.amountM)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ExpandableCard>
                <ExpandableCard title="広がるか" grade={expand}>
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>評価（人による修正）</span>
                      <select value={expand} onChange={(e) => setExpand(e.target.value)} className="rounded border border-gray-200 px-2 py-1 text-sm font-semibold">
                        {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <ul className="space-y-1.5">
                      <li>・組織展開：グループ会社・他拠点への展開余地 <EvidenceTag type="営業仮説" /></li>
                      <li>・領域展開：生産準備領域への機能拡張構想 <EvidenceTag type="AI仮説" /></li>
                      <li>・市場展開：{customer.industry}の同業他社への再利用可能性 <EvidenceTag type="営業仮説" /></li>
                    </ul>
                    <div>
                      <p className="mb-1 font-semibold text-slate-500">展開種別（展開種別マスター）</p>
                      <div className="flex flex-wrap gap-1">{expansionTypeMaster.map((e) => <Chip key={e.name}>{e.name}</Chip>)}</div>
                    </div>
                  </div>
                </ExpandableCard>
              </div>

              {changed && (
                <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  <span>変更内容により総合ランクが {customer.rank} → <b>{liveRank}</b>（{liveCode}）に変化します。営業方針は「{livePolicy}」になります。</span>
                  <button onClick={applyRecalc} className="ml-3 shrink-0 rounded bg-amber-600 px-3 py-1 text-white hover:bg-amber-700">この内容で確定</button>
                </div>
              )}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">総合評価</p>
                    <p className="text-xs text-slate-500">ハマるかを最重視し、儲かる・広がるを合わせて総合判断（単純加算はしない）</p>
                  </div>
                  <span className="rounded-lg bg-slate-800 px-4 py-2 text-2xl font-bold text-white">{liveRank}</span>
                </div>
              </Card>
            </div>
          )}

          {tab === "成熟度" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">取得できている情報・購買ステージの進み具合に応じて、論点ごとに状態と根拠（情報種別）を選択してください。成熟度Lvはこの選択内容から自動的に判定されます（マスター「成熟度論点」の●パターンとの照合）。</p>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500">論点</th>
                      <th className="text-xs font-medium text-slate-500">情報種別</th>
                      <th className="text-xs font-medium text-slate-500">状態</th>
                      {[1, 2, 3, 4, 5].map((l) => (
                        <th key={l} className={`text-xs font-medium ${l === customer.maturityLevel ? "text-indigo-600" : "text-slate-500"}`}>Lv{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {maturityItemMaster.map((masterItem, i) => {
                      const it = items[i] || { name: masterItem.name, status: "未確認", evidence: "未確認" };
                      const isConfirmed = it.status === "明確" || it.status === "合意済み";
                      return (
                        <tr key={masterItem.name}>
                          <td className="rounded-l-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">{masterItem.name}</td>
                          <td className="bg-slate-50 px-1 py-2 text-center">
                            <select
                              value={it.evidence}
                              onChange={(e) => {
                                const nextEvidence = e.target.value;
                                const nextTopics = items.map((t, ti) => (ti === i ? { name: t.name, status: t.status, evidence: nextEvidence } : { name: t.name, status: t.status, evidence: t.evidence }));
                                updateCustomer(customer.id, { topicData: nextTopics });
                              }}
                              className={`rounded border-0 px-1.5 py-0.5 text-xs font-medium ${EVIDENCE_STYLE[it.evidence]}`}
                            >
                              {EVIDENCE_OPTIONS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                            </select>
                          </td>
                          <td className="bg-slate-50 px-1 py-2 text-center">
                            <select
                              value={it.status}
                              onChange={(e) => {
                                const nextStatus = e.target.value;
                                const nextTopics = items.map((t, ti) => (ti === i ? { name: t.name, status: nextStatus, evidence: t.evidence } : { name: t.name, status: t.status, evidence: t.evidence }));
                                updateCustomer(customer.id, { topicData: nextTopics });
                              }}
                              className={`rounded border border-gray-200 px-1.5 py-0.5 text-sm font-medium ${it.status === "未確認" ? "text-gray-400" : it.status === "仮説" ? "text-amber-600" : it.status === "整理中" ? "text-blue-600" : "text-emerald-600"}`}
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          {[0, 1, 2, 3, 4].map((li) => {
                            const required = !!(masterItem.levels && masterItem.levels[li]);
                            const achieved = required && isConfirmed;
                            return (
                              <td key={li} className={`bg-slate-50 px-1 py-2 text-center ${li === 4 ? "rounded-r-lg" : ""}`}>
                                <div
                                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border text-base ${
                                    !required ? "border-gray-100 bg-gray-100 text-gray-200" :
                                    achieved ? "border-emerald-300 bg-emerald-50 text-emerald-500" : "border-amber-200 bg-amber-50 text-amber-400"
                                  }`}
                                >
                                  {!required ? "" : achieved ? "●" : "○"}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">●＝必要な論点が確認済み／○＝そのLvに必要だがまだ未確認／空欄＝そのLvでは対象外の論点</p>

              <div className="flex items-center justify-between rounded-lg bg-indigo-50 p-3">
                <span className="text-sm font-bold text-indigo-800">総合成熟度（自動判定）</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-500">（{totalStatuses}/{items.length}論点が明確・合意済み）</span>
                  <span className="rounded-md bg-white px-3 py-1 text-lg font-bold text-indigo-700">Lv{customer.maturityLevel}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                ※ 論点の状態を変更すると、成熟度Lv・コード（{customer.rank}{customer.maturityLevel}）・営業方針が自動的に再計算されます。論点は成熟度論点マスターで管理されています。「明確」以上にできるのは事実または営業仮説に基づく情報のみで、AI仮説を選択した場合は自動的に「仮説」相当に留められます。
                情報充足度は本タブの入力率（情報充足度マスターのしきい値：{Math.round(infoCompletenessMaster.sufficientRatio * 100)}%以上で「十分」）から自動算出されます。
              </p>
            </div>
          )}

          {tab === "評価履歴" && (
            <div className="space-y-2">
              {(HISTORY_TEMPLATES[customer.rank] || []).map((reason, i, arr) => {
                const level = Math.max(1, customer.maturityLevel - (arr.length - i));
                const rankIdx = Math.max(0, "ABCD".indexOf(customer.rank) - (arr.length - i > 1 ? 1 : 0));
                const rank = "ABCD"[rankIdx];
                return (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                    <span className="mt-0.5 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">{rank}{level}</span>
                    <div>
                      <p className="text-xs text-slate-500">2026/{String(3 + i * 2).padStart(2, "0")}</p>
                      <p className="text-sm text-slate-600">{reason}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                <span className="mt-0.5 rounded bg-indigo-600 px-2 py-0.5 font-mono text-xs font-bold text-white">{customer.code}</span>
                <div>
                  <p className="text-xs text-indigo-400">{customer.lastUpdated}（現在）</p>
                  <p className="text-sm text-indigo-700">現在の評価状態</p>
                </div>
              </div>
            </div>
          )}

          {tab === "情報ソース" && (
            <div className="space-y-2">
              {[
                { type: "面談メモ", date: customer.lastUpdated, note: `${customer.owner}によるヒアリング記録` },
                { type: "公開企業情報", date: "2026/06/01", note: "有価証券報告書・企業サイトより収集" },
                { type: "メール", date: "2026/06/15", note: "先方担当者との検討状況すり合わせ" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div><p className="text-sm font-medium text-slate-700">{s.type}</p><p className="text-xs text-slate-500">{s.note}</p></div>
                  <span className="text-xs text-slate-500">{s.date}</span>
                </div>
              ))}
              <button className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-500">＋ 情報を追加（自由記述／ファイル登録）</button>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
}

/* ============================== 評価レビュー ============================== */

function ReviewScreen({ customers, updateCustomer }) {
  const { sizeThresholds, industryMaster } = useMasters();
  const [statuses, setStatuses] = useState({});
  const [editing, setEditing] = useState(null); // `${id}-${key}` | null
  const rows = customers.filter((c) => c.infoCompleteness !== "十分" || c.rank === "A").slice(0, 10);
  const setStatus = (id, field, val) => setStatuses((s) => ({ ...s, [`${id}-${field}`]: val }));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">評価レビュー</h1>
        <p className="text-sm text-slate-500">AI判定の根拠を確認し、承認・修正します。1項目の修正は上位評価（総合ランク・営業方針）へ自動的に反映されます。</p>
      </div>

      {rows.map((c) => {
        const fields = [
          { key: "target", label: "ターゲット判定(業種)", ai: c.industryGrade, ground: c.industry },
          { key: "fit", label: "ハマるか", ai: c.fit, ground: "業務改革・製品情報管理領域が中心" },
          { key: "profit", label: "儲かるか", ai: c.profit, ground: `${sizeLabel(c.siAmountM, sizeThresholds)}規模、保守${c.hasMaintenance ? "あり" : "なし"}` },
          { key: "expand", label: "広がるか", ai: c.expand, ground: "組織・領域展開の仮説あり" },
          { key: "maturity", label: "成熟度", ai: `Lv${c.maturityLevel}`, ground: "To-Be・対象範囲は整理、予算は未確定" },
        ];
        return (
          <Card key={c.id} className="overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
              <span className="text-sm font-bold text-slate-700">{c.name}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-white">{c.code}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                  <th className="px-4 py-2">項目</th><th className="px-4 py-2">AI判定</th><th className="px-4 py-2">根拠</th><th className="px-4 py-2">状態</th><th className="px-4 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => {
                  const st = statuses[`${c.id}-${f.key}`] || "未確認";
                  const editKey = `${c.id}-${f.key}`;
                  const isEditing = editing === editKey;
                  return (
                    <React.Fragment key={f.key}>
                      <tr className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-2 text-slate-600">{f.label}</td>
                        <td className="px-4 py-2"><GradeBadge grade={f.ai.length <= 2 ? f.ai : "○"} />{f.ai.length > 2 && <span className="ml-1 text-xs text-slate-500">{f.ai}</span>}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">{f.ground}</td>
                        <td className="px-4 py-2"><span className={`text-xs font-medium ${st === "承認" ? "text-emerald-600" : st === "修正済み" ? "text-blue-600" : "text-amber-500"}`}>{st}</span></td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => setStatus(c.id, f.key, "承認")} className="flex items-center gap-1 rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"><Check size={12} />承認</button>
                            <button onClick={() => setEditing(isEditing ? null : editKey)} className="flex items-center gap-1 rounded border border-blue-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"><Pencil size={12} />修正</button>
                          </div>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr className="border-b border-gray-50 bg-blue-50/50 last:border-0">
                          <td colSpan={5} className="px-4 py-3">
                            <ReviewEditField
                              field={f.key}
                              customer={c}
                              industryMaster={industryMaster}
                              onSave={(patch) => { updateCustomer(c.id, patch); setStatus(c.id, f.key, "修正済み"); setEditing(null); }}
                              onCancel={() => setEditing(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {fields.some((f) => statuses[`${c.id}-${f.key}`] === "修正済み") && (
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 text-xs text-blue-700">
                <RotateCcw size={12} />修正内容に応じて総合ランク・営業方針を自動で即時再計算し、確定しました（評価履歴に修正元項目を記録）。
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ReviewEditField({ field, customer, industryMaster, onSave, onCancel }) {
  const [val, setVal] = useState(() => {
    if (field === "target") return customer.industry;
    if (field === "fit") return customer.fit;
    if (field === "expand") return customer.expand;
    if (field === "maturity") return customer.maturityLevel;
    return null;
  });
  const [amount, setAmount] = useState(customer.siAmountM);
  const [maintenance, setMaintenance] = useState(customer.hasMaintenance);

  const save = () => {
    if (field === "target") onSave({ industry: val });
    else if (field === "fit") onSave({ fit: val });
    else if (field === "expand") onSave({ expand: val });
    else if (field === "maturity") onSave({ maturityLevel: Number(val) });
    else if (field === "profit") onSave({ siAmountM: amount, hasMaintenance: maintenance });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {field === "target" && (
        <select value={val} onChange={(e) => setVal(e.target.value)} className="rounded border border-gray-200 px-2 py-1">
          {industryMaster.map((i) => <option key={i.name} value={i.name}>{i.name}</option>)}
        </select>
      )}
      {(field === "fit" || field === "expand") && (
        <select value={val} onChange={(e) => setVal(e.target.value)} className="rounded border border-gray-200 px-2 py-1 font-semibold">
          {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      )}
      {field === "maturity" && (
        <select value={val} onChange={(e) => setVal(e.target.value)} className="rounded border border-gray-200 px-2 py-1">
          {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Lv{l}</option>)}
        </select>
      )}
      {field === "profit" && (
        <>
          <label className="flex items-center gap-1">
            案件規模（SI金額）
            <input type="number" step="50" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-24 rounded border border-gray-200 px-2 py-1 text-right" />M
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />保守あり
          </label>
        </>
      )}
      <button onClick={save} className="rounded bg-blue-600 px-3 py-1 font-medium text-white hover:bg-blue-700">保存</button>
      <button onClick={onCancel} className="text-slate-500 hover:text-slate-600">キャンセル</button>
    </div>
  );
}

/* ============================== マスター設定：共通の編集用パーツ ============================== */

function ResetButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = React.useRef(null);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setConfirming(false);
    onConfirm();
  };

  return (
    <button
      onClick={handleClick}
      className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        confirming ? "border-red-400 bg-red-50 text-red-600" : "border-gray-200 text-slate-500 hover:border-red-200 hover:text-red-600"
      }`}
    >
      {confirming ? "本当に戻す？もう一度クリック" : "初期状態に戻す"}
    </button>
  );
}

function SimpleListEditor({ items, setItems, withGrade, withDesc, addLabel }) {
  const update = (i, patch) => setItems((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const add = () => setItems((arr) => [...arr, { name: "新しい項目", ...(withGrade ? { grade: "△" } : {}), ...(withDesc ? { desc: "" } : {}) }]);
  return (
    <div className="space-y-2">
      {items.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <input value={row.name} onChange={(e) => update(i, { name: e.target.value })} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
            {withDesc && (
              <input value={row.desc || ""} onChange={(e) => update(i, { desc: e.target.value })} placeholder="説明" className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-slate-500" />
            )}
          </div>
          {withGrade && (
            <select value={row.grade} onChange={(e) => update(i, { grade: e.target.value })} className="rounded border border-gray-200 px-2 py-1 text-sm">
              {GRADE_OPTIONS.map((g) => <option key={g}>{g}</option>)}
            </select>
          )}
          <button onClick={() => remove(i)} className="mt-1 text-slate-300 hover:text-red-500"><X size={14} /></button>
        </div>
      ))}
      <button onClick={add} className="mt-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-500">＋ {addLabel || "項目を追加"}</button>
    </div>
  );
}

/* ============================== 考え方（フレームワーク解説） ============================== */

const MATURITY_LEVEL_DESCRIPTIONS = [
  ["課題感がある", "主な課題を整理", "課題と施策が対応", "要件・評価条件へ反映", "合意済み"],
  ["曖昧・仮説段階", "方向性を整理", "社内合意を形成", "提案評価の前提として明確", "合意済み"],
  ["候補・未確定", "初期範囲を整理", "フェーズ・範囲を具体化", "提案条件として明確", "契約範囲として確定"],
  ["未整理", "効果仮説を整理", "効果・投資妥当性を検討", "投資判断・評価に利用", "承認済み"],
  ["未定", "概算感を把握", "予算化・稟議を推進", "予算枠が具体化・確保", "承認・確定"],
  ["未定", "大まかな時期感", "計画・マイルストーンを具体化", "提案条件として提示", "開始日程を確定"],
  ["担当者中心", "関係部門・キーマンを特定", "推進体制・決裁ルートを整備", "選定体制・評価者が明確", "実行体制まで確定"],
  ["未整理", "構想レベルの要求", "要件整理を開始", "RFP・提案条件として明確", "合意済み"],
  ["未定", "検討方法を模索", "RFI・RFP準備", "評価基準・比較方法が明確", "選定結果に反映"],
  ["未着手", "未着手", "初期検討", "契約・導入条件を調整", "契約・導入計画を確定"],
];

// 各論点が「進んでいる」とみなせる最初のレベル（星取表の★開始位置）
// 各論点の★開始位置は成熟度論点マスター（maturityItemMaster[i].levels）で管理

const RANK_COLOR = { A: "emerald", B: "blue", C: "amber", D: "gray" };

function buildRankCombinations() {
  const nonD = GRADE_OPTIONS.filter((g) => g !== "✕");
  const groups = { A: [], B: [], C: [] };
  nonD.forEach((fit) => {
    nonD.forEach((profit) => {
      nonD.forEach((expand) => {
        const r = judgeRank(fit, profit, expand);
        if (groups[r]) groups[r].push([fit, profit, expand]);
      });
    });
  });
  return [
    { rank: "A", combos: groups.A },
    { rank: "B", combos: groups.B },
    { rank: "C", combos: groups.C },
    { rank: "D", combos: [["いずれかが✕", "－", "－"]] },
  ];
}
const RANK_COMBINATIONS = buildRankCombinations();

const FIT_FACTORS = [
  { name: "案件の目的", note: "背景・導入目的・解決したい経営/業務課題・期待効果", detail: "単純なシステム更新よりも、業務改善・業務改革・経営基盤構築を目指す案件の方が価値を発揮しやすい。ただし更新案件でも、業務改革や全社活用まで視野に入れていれば評価は高くできる。" },
  { name: "対象スコープ", note: "対象データ・機能・業務・部門・拠点、初期導入範囲と将来構想", detail: "対象範囲の広さや機能数では判定しない。見るのは対象の数ではなく、価値を発揮できる中核領域かどうか。" },
  { name: "課題属性", note: "製品情報管理・業務横断・変更管理・標準化・データ活用・業務改革", detail: "単一部門の局所的な利便性改善より、製品情報の一元化や部門横断連携、変更統制、全社標準化などの課題の方が適合性は高い。" },
  { name: "製品特性", note: "製品構成・部品点数・バリエーション・設計変更頻度・生産準備の複雑性・拠点数", detail: "製品・構成・変更・生産準備が複雑なほど、情報統制や業務連携の価値が高まる。製品特性だけでは判定せず、目的・スコープ・課題属性と合わせて判断する。" },
];

const EXPAND_FACTORS = [
  { name: "組織展開", note: "他部門・他事業部・他工場・他拠点・グループ会社への展開可能性" },
  { name: "領域展開", note: "機能拡張、または設計・生産準備・調達・品質・原価・生産などへの業務領域拡張" },
  { name: "市場展開", note: "同業他社・他業界への再利用可能性、重点市場での実績化" },
];

function StepAccordion({ n, title, subtitle, target, question, output, color, open, onToggle, children }) {
  const s = COLOR_PALETTE[color];
  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${s.dot}`}>{n}</span>
          <div>
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>評価対象：<b className="text-slate-700">{target}</b></span>
              <span>判断すること：<b className="text-slate-700">{question}</b></span>
              <span>出力：<b className="text-slate-700">{output}</b></span>
            </dl>
          </div>
        </div>
        {open ? <ChevronDown size={18} className="mt-1 shrink-0 text-slate-500" /> : <ChevronRight size={18} className="mt-1 shrink-0 text-slate-500" />}
      </button>
      {open && <div className={`space-y-4 border-t p-4 ${s.bg} ${s.border}`}>{children}</div>}
    </Card>
  );
}

function FrameworkPage() {
  const {
    policyMatrix, policyColorMaster, industryMaster, companySizeMaster, areaMaster,
    sizeThresholds, maturityItemMaster, issueAttributeMaster, scopeMaster,
    productCharMaster, expansionTypeMaster,
  } = useMasters();
  const [profitTab, setProfitTab] = useState("ハマるか");
  const [openSections, setOpenSections] = useState({ 1: false, 2: false, 3: false, 4: false });
  const toggleSection = (n) => setOpenSections((s) => ({ ...s, [n]: !s[n] }));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">このアプリの考え方</h1>
        <p className="text-sm text-slate-500">
          限られた営業リソースを適切な顧客へ配分するための、4段階の判断フレームワークです。単純な点数加算ではなく段階を分けて評価することで、短期・中期・将来案件をバランスよく管理します。
          各項目をクリックすると、その場で詳細が開きます。
        </p>
      </div>

      <StepAccordion n={1} title="① ターゲット判定" subtitle="会社属性（業種・企業規模・エリア）だけで判定する。案件内容はここでは見ない。" target="会社" question="営業戦略上、狙う会社か" output="ターゲット／チャレンジ／対象外" color="blue" open={openSections[1]} onToggle={() => toggleSection(1)}>
        <div>
          <p className="mb-2 text-xs font-bold text-slate-600">業種（業種マスター）</p>
          <table className="w-full table-fixed text-xs">
            <thead><tr className="text-left text-slate-500"><th className="w-16 py-1">評価</th><th className="py-1">該当する業種</th></tr></thead>
            <tbody>
              {GRADE_OPTIONS.map((g) => (
                <tr key={g} className="border-b border-gray-50 align-top last:border-0">
                  <td className="py-1.5"><GradeBadge grade={g} /></td>
                  <td className="py-1.5 text-slate-600">
                    {industryMaster.filter((i) => i.grade === g).map((i) => i.name).join("、") || "－"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-slate-600">企業規模（企業規模マスター・単位：億円）</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="w-16 py-1">評価</th>
                {Object.keys(companySizeMaster).map((type) => <th key={type} className="py-1">{type}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-1.5"><GradeBadge grade="◎" /></td>
                {Object.values(companySizeMaster).map((t, i) => <td key={i} className="py-1.5 text-slate-600">{t.great}億円以上</td>)}
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-1.5"><GradeBadge grade="○" /></td>
                {Object.values(companySizeMaster).map((t, i) => <td key={i} className="py-1.5 text-slate-600">{t.good}億円以上</td>)}
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-1.5"><GradeBadge grade="△" /></td>
                {Object.values(companySizeMaster).map((t, i) => <td key={i} className="py-1.5 text-slate-600">{t.fair}億円以上</td>)}
              </tr>
              <tr>
                <td className="py-1.5"><GradeBadge grade="✕" /></td>
                {Object.values(companySizeMaster).map((t, i) => <td key={i} className="py-1.5 text-slate-600">{t.fair}億円未満</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-slate-600">エリア（エリアマスター）</p>
          <table className="w-full table-fixed text-xs">
            <thead><tr className="text-left text-slate-500"><th className="w-16 py-1">評価</th><th className="py-1">該当する区分</th></tr></thead>
            <tbody>
              {GRADE_OPTIONS.map((g) => (
                <tr key={g} className="border-b border-gray-50 align-top last:border-0">
                  <td className="py-1.5"><GradeBadge grade={g} /></td>
                  <td className="py-1.5 text-slate-600">
                    {areaMaster.filter((a) => a.grade === g).map((a) => a.label).join("、") || "－"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
          判定順序：✕がある→<b>対象外</b>／✕はないが△がある→<b>チャレンジ</b>／◎・○のみ→<b>ターゲット</b>（点数加算はしない）
        </div>
        <div>
          <p className="mb-1 text-xs font-bold text-slate-500">この段階では見ない情報</p>
          <p className="text-xs text-slate-500">顧客課題、案件テーマ、対象部門、BOM・BOPの対象範囲、案件の目的、製品特性、想定案件金額、保守の有無、横展開可能性、予算化状況、RFI・RFP、推進体制、受注確度（これらは②③で確認する）</p>
        </div>
      </StepAccordion>

      <StepAccordion n={2} title="② ターゲット評価" subtitle="ハマる・儲かる・広がるの3軸で案件の価値を評価し、A〜Dを付与する。" target="案件" question="ハマる・儲かる・広がるか" output="A〜D" color="purple" open={openSections[2]} onToggle={() => toggleSection(2)}>
        <Tabs tabs={["ハマるか", "儲かるか", "広がるか", "総合ランク"]} active={profitTab} onChange={setProfitTab} />

        {profitTab === "ハマるか" && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">ものづくリンクの強みをどれだけ発揮できるかを、4つの判断材料から総合判断する。単純な機能数や対象範囲の広さでは判定しない。最も重視する項目。</p>
            <table className="w-full text-xs">
              <tbody>
                {[["◎", "本来価値を十分発揮できる"], ["○", "主要な強みを発揮できる"], ["△", "対応可能だが価値・範囲・効果が限定的"], ["✕", "強みとの関連が弱く提案意義がほとんどない"]].map(([g, d]) => (
                  <tr key={g} className="border-b border-gray-50 last:border-0">
                    <td className="w-10 py-1"><GradeBadge grade={g} /></td><td className="py-1 text-slate-600">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {FIT_FACTORS.map((f) => (
              <div key={f.name} className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs font-bold text-slate-700">{f.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">確認する情報：{f.note}</p>
                <p className="mt-1 text-xs text-slate-600">{f.detail}</p>
              </div>
            ))}
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">関連する課題属性（課題属性マスター）</p>
              <div className="flex flex-wrap gap-1">{issueAttributeMaster.map((a) => <Chip key={a.name}>{a.name}</Chip>)}</div>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">対象スコープ（対象スコープマスター）</p>
              <div className="flex flex-wrap gap-1">{scopeMaster.map((s) => <Chip key={s.name}>{s.name}</Chip>)}</div>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">製品特性（製品特性マスター）</p>
              <div className="flex flex-wrap gap-1">{productCharMaster.map((p) => <Chip key={p.name}>{p.name}</Chip>)}</div>
            </div>
          </div>
        )}

        {profitTab === "儲かるか" && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">今回案件単体の受注額規模と、保守・継続収益の有無から自動判定する。将来の横展開は含めない。</p>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-500"><th className="py-1">規模</th><th className="py-1">金額</th></tr></thead>
              <tbody>
                <tr className="border-b border-gray-50"><td className="py-1 font-semibold text-slate-700">大</td><td className="py-1 text-slate-600">{sizeThresholds.large}億円以上</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1 font-semibold text-slate-700">中</td><td className="py-1 text-slate-600">{sizeThresholds.medium}億円以上、{sizeThresholds.large}億円未満</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1 font-semibold text-slate-700">小</td><td className="py-1 text-slate-600">{sizeThresholds.small}億円以上、{sizeThresholds.medium}億円未満</td></tr>
                <tr><td className="py-1 font-semibold text-slate-700">対象外</td><td className="py-1 text-slate-600">{sizeThresholds.small}億円未満</td></tr>
              </tbody>
            </table>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-500"><th className="py-1">規模＼保守</th><th className="py-1">保守あり</th><th className="py-1">保守なし</th></tr></thead>
              <tbody>
                <tr className="border-b border-gray-50"><td className="py-1 font-semibold text-slate-700">大</td><td><GradeBadge grade="◎" /></td><td><GradeBadge grade="○" /></td></tr>
                <tr className="border-b border-gray-50"><td className="py-1 font-semibold text-slate-700">中</td><td><GradeBadge grade="◎" /></td><td><GradeBadge grade="△" /></td></tr>
                <tr className="border-b border-gray-50"><td className="py-1 font-semibold text-slate-700">小</td><td><GradeBadge grade="○" /></td><td><GradeBadge grade="✕" /></td></tr>
                <tr><td className="py-1 font-semibold text-slate-700">対象外</td><td><GradeBadge grade="✕" /></td><td><GradeBadge grade="✕" /></td></tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-500">金額・案件規模のしきい値は「案件規模マスター」で編集できます。想定受注額は確度（仮説／概算／確定）を分けて管理し、事実・営業仮説に基づく金額のみ「概算」以上として扱います。</p>
          </div>
        )}

        {profitTab === "広がるか" && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">今回案件の売上ではなく、将来の展開可能性を評価する。</p>
            <table className="w-full text-xs">
              <tbody>
                {[["◎", "3方向すべてに具体的かつ大きな展開が期待できる"], ["○", "2方向以上で展開が期待できる"], ["△", "1方向で展開が期待できる"], ["✕", "展開余地がほとんどない"]].map(([g, d]) => (
                  <tr key={g} className="border-b border-gray-50 last:border-0">
                    <td className="w-10 py-1"><GradeBadge grade={g} /></td><td className="py-1 text-slate-600">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {EXPAND_FACTORS.map((f) => (
              <div key={f.name} className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs font-bold text-slate-700">{f.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">{f.note}</p>
              </div>
            ))}
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">展開種別（展開種別マスター）</p>
              <div className="flex flex-wrap gap-1">{expansionTypeMaster.map((e) => <Chip key={e.name}>{e.name}</Chip>)}</div>
            </div>
            <p className="text-xs text-slate-500">「顧客が明言している」「営業側の仮説」「将来可能性はあるが未確認」「展開なし」を区別して記録する。</p>
          </div>
        )}

        {profitTab === "総合ランク" && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">ハマるかを最も重視し、儲かる・広がるは今回の収益価値／将来の事業価値として加味する。単純な点数加算はしない。ハマるかが低い案件を金額や将来性だけでAにはしない。</p>

            <div>
              <p className="mb-1 text-xs font-bold text-slate-600">組み合わせの考え方：ハマる × 儲かる × 広がる → 案件価値</p>
              <p className="mb-2 text-xs text-slate-500">縦軸がランク（A〜D）、横軸がハマる・儲かる・広がるです。代表的な◎○△✕の組み合わせを示します（実際の判定ロジックと整合）。</p>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-1 text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="w-12 py-1">ランク</th>
                      <th className="py-1">ハマるか</th>
                      <th className="py-1">儲かるか</th>
                      <th className="py-1">広がるか</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RANK_COMBINATIONS.map((block) => {
                      const s = COLOR_PALETTE[RANK_COLOR[block.rank]];
                      return block.combos.map((combo, i) => (
                        <tr key={`${block.rank}-${i}`} className="border-b border-gray-50 last:border-0">
                          {i === 0 && (
                            <td rowSpan={block.combos.length} className={`rounded-l align-top font-bold ${s.bg} ${s.text}`}>
                              <div className="flex h-full items-center justify-center py-2 text-sm">{block.rank}</div>
                            </td>
                          )}
                          {combo.map((g, ci) => (
                            <td key={ci} className="py-1.5">{g === "◎" || g === "○" || g === "△" || g === "✕" ? <GradeBadge grade={g} /> : <span className="text-slate-500">{g}</span>}</td>
                          ))}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </StepAccordion>

      <StepAccordion n={3} title="③ 案件成熟度" subtitle="面談回数や営業活動量ではなく、顧客側の意思決定論点がどこまで具体化しているかで判断する。" target="顧客の意思決定状況" question="論点がどこまで具体化しているか" output="Lv1〜Lv5" color="teal" open={openSections[3]} onToggle={() => toggleSection(3)}>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {["Lv1 情報収集", "Lv2 構想・方向性整理", "Lv3 計画・予算化", "Lv4 提案・比較検討", "Lv5 最終選定・契約"].map((l) => (
            <div key={l} className="rounded-lg bg-teal-50 p-2 font-medium text-teal-700">{l}</div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="w-32 text-left text-slate-500">論点</th>
                {[1, 2, 3, 4, 5].map((l) => <th key={l} className="font-medium text-slate-500">Lv{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {maturityItemMaster.map((item, i) => (
                <tr key={item.name}>
                  <td className="rounded bg-slate-50 px-2 py-1.5 font-semibold text-slate-600">{item.name}</td>
                  {[1, 2, 3, 4, 5].map((l) => {
                    const started = !!(item.levels && item.levels[l - 1]);
                    const desc = (MATURITY_LEVEL_DESCRIPTIONS[i] || [])[l - 1] || "";
                    return (
                      <td key={l} title={desc} className="rounded bg-slate-50 py-1.5 text-center">
                        <span className={started ? "text-base text-emerald-500" : "text-base text-gray-200"}>{started ? "●" : "○"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-slate-500">● は論点の検討が具体的に進み始めた状態、○ はまだ手つかずの状態を示します。セルにカーソルを合わせると、その段階の具体的な状態を確認できます。</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-bold text-slate-500">判定例</p>
          <ul className="space-y-1 text-xs text-slate-600">
            <li>・打ち合わせ回数が多くても、課題や目的が曖昧ならLv1。</li>
            <li>・初回面談でも、予算・体制・RFPが明確ならLv4。</li>
            <li>・To-Beは明確でも、予算・体制が未整理ならLv2。</li>
            <li>・提案依頼が出ていても、単なる情報提供依頼であればLv4とは限らない。</li>
          </ul>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          各論点を「明確」以上にできるのは<b>事実</b>または<b>営業仮説</b>に基づく情報のみ。AI仮説のみの情報では成熟度を過大評価しないよう、明確化には根拠の情報種別を要求する（情報充足度マスターの入力率しきい値とあわせて運用）。
        </div>

      </StepAccordion>

      <StepAccordion n={4} title="④ 営業方針" subtitle="案件価値（A〜D）× 成熟度（Lv1〜5）を掛け合わせ、取り組み方を決める。" target="案件価値 × 成熟度" question="リソースをどう配分するか" output="取り切る／攻める／育てる／見極める／見送る" color="orange" open={openSections[4]} onToggle={() => toggleSection(4)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th></th>
                {[1, 2, 3, 4, 5].map((l) => <th key={l} className="font-medium text-slate-500">Lv{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {["A", "B", "C", "D"].map((r) => (
                <tr key={r}>
                  <td className="text-center font-bold text-slate-600">{r}</td>
                  {[1, 2, 3, 4, 5].map((l) => {
                    const policy = policyMatrix[r][l];
                    const s = COLOR_PALETTE[policyColorMaster[policy]] || COLOR_PALETTE.gray;
                    return (
                      <td key={l} className={`rounded p-2 text-center ${s.bg} ${s.text}`}>
                        <div className="font-mono text-xs opacity-60">{r}{l}</div>
                        <div className="font-medium">{policy}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <table className="w-full text-xs">
          <tbody>
            {[
              ["取り切る", "受注を最優先とし、営業・技術・マネジメントのリソースを集中する"],
              ["攻める", "案件を前進させるため、積極的な提案・働きかけを行う"],
              ["育てる", "構想・課題整理・計画化を支援し、将来の案件化・予算化につなげる"],
              ["見極める", "必要な接点は維持しつつ、追加投資する価値とタイミングを確認する"],
              ["見送る", "積極的な営業投資は行わず、必要最低限の対応にとどめる"],
            ].map(([name, desc]) => (
              <tr key={name} className="border-b border-gray-50 last:border-0">
                <td className="w-24 py-1.5"><PolicyPill policy={name} /></td><td className="py-1.5 text-slate-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-500">マトリクスは「営業方針マスター」、色は「色設定」で編集でき、変更はダッシュボードにもそのまま反映されます。</p>
      </StepAccordion>

      <Card className="p-5">
        <h2 className="mb-2 text-base font-bold text-slate-700">この設計の基本思想</h2>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li>・単に「売上になりそうな案件から追う」ことはしない。ターゲットに合う会社か／価値を発揮できる案件か／収益が見込めるか／将来性があるか／検討がどこまで進んでいるかを分けて評価する。</li>
          <li>・A〜Dは「案件として追う価値」、Lv1〜Lv5は「顧客の検討状況」、色分けは「営業としての取り組み方」を表す。</li>
          <li>・目の前の売上だけでなく、短期受注案件・中期育成案件・将来案件をバランスよく管理できる。</li>
        </ul>
      </Card>
    </div>
  );
}

/* ============================== マスター設定 ============================== */

function MasterSettings() {
  const {
    industryMaster, setIndustryMaster,
    companySizeMaster, setCompanySizeMaster,
    areaMaster, setAreaMaster,
    sizeThresholds, setSizeThresholds,
    issueAttributeMaster, setIssueAttributeMaster,
    scopeMaster, setScopeMaster,
    productCharMaster, setProductCharMaster,
    expansionTypeMaster, setExpansionTypeMaster,
    maturityItemMaster, setMaturityItemMaster,
    infoCompletenessMaster, setInfoCompletenessMaster,
    policyMatrix, setPolicyMatrix,
    policyColorMaster, setPolicyColorMaster,
    salesOrgMaster, setSalesOrgMaster,
    licenseForecastMaster, setLicenseForecastMaster,
    maintenanceForecastMaster, setMaintenanceForecastMaster,
    projectDurationMaster, setProjectDurationMaster,
    revenuePhases, setRevenuePhases,
    additionalDevRule, setAdditionalDevRule,
    resetAllData,
  } = useMasters();

  const masterGroups = [
    {
      group: "① ターゲット判定", color: "blue",
      desc: "会社属性から営業対象かを判定する基準",
      items: [
        { name: "業種", connected: true },
        { name: "企業規模", connected: true },
        { name: "エリア", connected: true },
      ],
    },
    {
      group: "② ターゲット評価", color: "purple",
      desc: "ハマる・儲かる・広がるを判断する基準",
      items: [
        { name: "案件規模", connected: true },
        { name: "課題属性", connected: true },
        { name: "対象スコープ", connected: true },
        { name: "製品特性", connected: true },
        { name: "展開種別", connected: true },
      ],
    },
    {
      group: "③ 案件成熟度", color: "teal",
      desc: "顧客の検討状況を判断する基準",
      items: [
        { name: "成熟度論点", connected: true },
        { name: "情報充足度", connected: true },
      ],
    },
    {
      group: "④ 営業方針", color: "orange",
      desc: "案件価値×成熟度から取り組み方を決める基準",
      items: [
        { name: "営業方針", connected: true },
        { name: "色設定", connected: true },
      ],
    },
    {
      group: "⑤ 営業体制", color: "gray",
      desc: "担当課・担当者の構成",
      items: [
        { name: "担当課・担当者", connected: true },
      ],
    },
    {
      group: "⑥ 収益計画", color: "emerald",
      desc: "案件規模に応じた収益・期間の前提",
      items: [
        { name: "規模別収益前提", connected: true },
        { name: "売上計上フェーズ", connected: true },
        { name: "追加開発ルール", connected: true },
      ],
    },
  ];

  const [activeMaster, setActiveMaster] = useState("業種");

  const selectMaster = (name) => setActiveMaster(name);

  const updateSizeMaster = (type, key, val) => setCompanySizeMaster((m) => ({ ...m, [type]: { ...m[type], [key]: Number(val) } }));
  const updateAreaMaster = (id, patch) => setAreaMaster((arr) => arr.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const updatePolicyCell = (rank, level, val) => setPolicyMatrix((m) => ({ ...m, [rank]: { ...m[rank], [level]: val } }));

  const addMember = (sectionIdx) => {
    setSalesOrgMaster((arr) => arr.map((s, i) => (i === sectionIdx ? { ...s, members: [...s.members, "新しい担当者"] } : s)));
  };
  const removeMember = (sectionIdx, memberIdx) => {
    setSalesOrgMaster((arr) => arr.map((s, i) => (i === sectionIdx ? { ...s, members: s.members.filter((_, mi) => mi !== memberIdx) } : s)));
  };
  const renameMember = (sectionIdx, memberIdx, val) => {
    setSalesOrgMaster((arr) => arr.map((s, i) => (i === sectionIdx ? { ...s, members: s.members.map((m, mi) => (mi === memberIdx ? val : m)) } : s)));
  };

  const updateLicense = (cat, val) => setLicenseForecastMaster((m) => ({ ...m, [cat]: Number(val) }));
  const updateMaintenanceForecast = (cat, val) => setMaintenanceForecastMaster((m) => ({ ...m, [cat]: Number(val) }));
  const updateDuration = (cat, val) => setProjectDurationMaster((m) => ({ ...m, [cat]: Number(val) }));
  const updatePhase = (idx, key, val) => setRevenuePhases((arr) => arr.map((p, i) => (i === idx ? { ...p, [key]: Number(val) / 100 } : p)));


  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">マスター設定</h1>
          <p className="text-sm text-slate-500">判定基準・評価ルール・選択肢を管理します。すべてのマスターが実際の判定ロジック・画面表示に連動しています。変更は自動的に保存されます。</p>
        </div>
        <ResetButton onConfirm={resetAllData} />
      </div>

      <div className="flex items-start gap-3">
        <div
          className="shrink-0 space-y-2 overflow-y-auto sm:space-y-3"
          style={{ width: 336, position: "sticky", top: "4rem", maxHeight: "calc(100vh - 5rem)" }}
        >
          {masterGroups.map((g) => {
            const s = COLOR_PALETTE[g.color];
            return (
              <div key={g.group} className={`overflow-hidden rounded-xl border ${s.border}`}>
                <div className={`break-words px-3 py-2 text-sm font-bold leading-tight ${s.bg} ${s.text}`}>{g.group}</div>
                <div className="divide-y divide-gray-50 bg-white">
                  {g.items.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => selectMaster(m.name)}
                      className={`flex w-full flex-row items-center justify-between gap-0.5 break-words px-3 py-2 text-left text-sm leading-tight transition-colors ${
                        activeMaster === m.name ? `${s.bg} ${s.text} font-semibold` : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{m.name}</span>
                      {m.connected && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-700">連動</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {activeMaster === "業種" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">業種</h3>
            <p className="mb-2 text-xs text-slate-500">業種と◎○△✕の対応。ターゲット判定の業種スコアに使用されます。</p>
            <SimpleListEditor items={industryMaster} setItems={setIndustryMaster} withGrade addLabel="業種を追加" />
          </Card>
          )}

          {activeMaster === "企業規模" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">企業規模</h3>
            <p className="mb-3 text-xs text-slate-500">区分ごとの売上高しきい値（億円）。ターゲット判定の企業規模スコアに使用されます。</p>
            <div className="space-y-4">
              {Object.entries(companySizeMaster).map(([type, t]) => (
                <div key={type} className="rounded-lg border border-gray-100 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">{type}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[["◎（以上）", "great"], ["○（以上）", "good"], ["△（以上）", "fair"]].map(([label, key]) => (
                      <label key={key} className="text-xs text-slate-500">
                        {label}
                        <div className="mt-1 flex items-center gap-1">
                          <input type="number" value={t[key]} onChange={(e) => updateSizeMaster(type, key, e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
                          <span>億円</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          )}

          {activeMaster === "エリア" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">エリア</h3>
            <p className="mb-2 text-xs text-slate-500">拠点・地域の区分と判定。ターゲット判定のエリアスコアに使用されます。</p>
            <div className="space-y-2">
              {areaMaster.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
                  <input value={a.label} onChange={(e) => updateAreaMaster(a.id, { label: e.target.value })} className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm" />
                  <select value={a.grade} onChange={(e) => updateAreaMaster(a.id, { grade: e.target.value })} className="rounded border border-gray-200 px-2 py-1 text-sm">
                    {GRADE_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Card>
          )}

          {activeMaster === "案件規模" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">案件規模</h3>
            <p className="mb-3 text-xs text-slate-500">案件規模（大中小）のしきい値（M＝百万円、50M単位）。儲かるか評価の案件規模判定、および⑥収益計画の規模区分に使用されます。</p>
            <div className="grid grid-cols-3 gap-3">
              {[["大（以上）", "large"], ["中（以上）", "medium"], ["小（以上）", "small"]].map(([label, key]) => (
                <label key={key} className="text-xs text-slate-500">
                  {label}
                  <div className="mt-1 flex items-center gap-1">
                    <input type="number" step="50" value={sizeThresholds[key]} onChange={(e) => setSizeThresholds((s) => ({ ...s, [key]: Number(e.target.value) }))} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
                    <span>M</span>
                  </div>
                </label>
              ))}
            </div>
          </Card>
          )}

          {activeMaster === "課題属性" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">課題属性</h3>
            <p className="mb-2 text-xs text-slate-500">顧客が解決しようとしている課題の分類。案件評価「ハマるか」タブに表示されます。</p>
            <SimpleListEditor items={issueAttributeMaster} setItems={setIssueAttributeMaster} withDesc addLabel="課題属性を追加" />
          </Card>
          )}

          {activeMaster === "対象スコープ" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">対象スコープ</h3>
            <p className="mb-2 text-xs text-slate-500">案件の対象範囲の選択肢。案件評価「ハマるか」タブに表示されます。</p>
            <SimpleListEditor items={scopeMaster} setItems={setScopeMaster} addLabel="対象スコープを追加" />
          </Card>
          )}

          {activeMaster === "製品特性" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">製品特性</h3>
            <p className="mb-2 text-xs text-slate-500">製品・生産の複雑性に関する着目点。案件評価「ハマるか」タブに表示されます。</p>
            <SimpleListEditor items={productCharMaster} setItems={setProductCharMaster} withDesc addLabel="製品特性を追加" />
          </Card>
          )}

          {activeMaster === "展開種別" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">展開種別</h3>
            <p className="mb-2 text-xs text-slate-500">将来の展開方向の分類。案件評価「広がるか」タブに表示されます。</p>
            <SimpleListEditor items={expansionTypeMaster} setItems={setExpansionTypeMaster} withDesc addLabel="展開種別を追加" />
          </Card>
          )}

          {activeMaster === "成熟度論点" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">成熟度論点</h3>
            <p className="mb-3 text-xs text-slate-500">成熟度を判定する論点（縦軸）と、Lv1〜5（横軸）。セルをクリックすると●のオン／オフを切り替えられます。「考え方」ページの成熟度マトリクスに反映されます。</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-separate border-spacing-1 text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500">論点</th>
                    {[1, 2, 3, 4, 5].map((l) => <th key={l} className="text-xs font-medium text-slate-500">Lv{l}</th>)}
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {maturityItemMaster.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          value={item.name}
                          onChange={(e) => setMaturityItemMaster((arr) => arr.map((it, idx) => (idx === i ? { ...it, name: e.target.value } : it)))}
                          className="w-32 rounded border border-gray-200 px-2 py-1 text-sm"
                        />
                      </td>
                      {[0, 1, 2, 3, 4].map((li) => {
                        const on = !!(item.levels && item.levels[li]);
                        return (
                          <td key={li} className="text-center">
                            <button
                              onClick={() => setMaturityItemMaster((arr) => arr.map((it, idx) => {
                                if (idx !== i) return it;
                                const levels = [...(it.levels || [false, false, false, false, false])];
                                levels[li] = !levels[li];
                                return { ...it, levels };
                              }))}
                              className={`h-8 w-8 rounded-lg border text-base ${on ? "border-emerald-300 bg-emerald-50 text-emerald-500" : "border-gray-200 bg-white text-gray-200 hover:border-gray-300"}`}
                            >
                              {on ? "●" : "○"}
                            </button>
                          </td>
                        );
                      })}
                      <td>
                        <button onClick={() => setMaturityItemMaster((arr) => arr.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setMaturityItemMaster((arr) => [...arr, { name: "新しい論点", levels: [false, false, false, false, false] }])}
              className="mt-2 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-500"
            >
              ＋ 論点を追加
            </button>
          </Card>
          )}

          {activeMaster === "情報充足度" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">情報充足度</h3>
            <p className="mb-3 text-xs text-slate-500">成熟度論点の入力率から情報充足度（十分／不足あり／未評価）を自動算出するしきい値です。</p>
            <label className="block text-xs text-slate-500">
              「十分」とみなす入力率のしきい値
              <div className="mt-1 flex items-center gap-2">
                <input type="range" min={0} max={100} value={Math.round(infoCompletenessMaster.sufficientRatio * 100)} onChange={(e) => setInfoCompletenessMaster({ sufficientRatio: Number(e.target.value) / 100 })} className="flex-1" />
                <span className="w-12 text-right text-sm font-semibold text-slate-700">{Math.round(infoCompletenessMaster.sufficientRatio * 100)}%</span>
              </div>
            </label>
            <p className="mt-2 text-xs text-slate-500">入力済み論点が0件の場合は「未評価」、しきい値未満は「不足あり」、しきい値以上は「十分」と判定されます。</p>
          </Card>
          )}

          {activeMaster === "営業方針" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">営業方針</h3>
            <p className="mb-3 text-xs text-slate-500">案件価値（A〜D）×成熟度（Lv1〜5）ごとの営業方針。ダッシュボードのマトリクスに使用されます。</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-separate border-spacing-1 text-sm">
                <thead>
                  <tr>
                    <th></th>
                    {[1, 2, 3, 4, 5].map((l) => <th key={l} className="text-xs font-medium text-slate-500">Lv{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {["A", "B", "C", "D"].map((r) => (
                    <tr key={r}>
                      <td className="text-center text-sm font-bold text-slate-600">{r}</td>
                      {[1, 2, 3, 4, 5].map((l) => {
                        const s = COLOR_PALETTE[policyColorMaster[policyMatrix[r][l]]] || COLOR_PALETTE.gray;
                        return (
                          <td key={l}>
                            <select value={policyMatrix[r][l]} onChange={(e) => updatePolicyCell(r, l, e.target.value)} className={`w-full rounded border px-1 py-1 text-xs ${s.bg} ${s.border} ${s.text}`}>
                              {POLICY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          )}

          {activeMaster === "色設定" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">色設定</h3>
            <p className="mb-2 text-xs text-slate-500">営業方針ごとの表示色。ダッシュボードのマトリクス・各画面のバッジに使用されます。</p>
            <div className="space-y-2">
              {POLICY_OPTIONS.map((p) => (
                <div key={p} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                  <span className="text-sm text-slate-700">{p}</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full ${COLOR_PALETTE[policyColorMaster[p]].swatch}`} />
                    <select value={policyColorMaster[p]} onChange={(e) => setPolicyColorMaster((m) => ({ ...m, [p]: e.target.value }))} className="rounded border border-gray-200 px-2 py-1 text-sm">
                      {Object.keys(COLOR_PALETTE).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          )}

          {activeMaster === "担当課・担当者" && (
            <Card className="p-4">
            <h3 className="mb-1 text-base font-bold text-slate-700">担当課・担当者</h3>
            <p className="mb-3 text-xs text-slate-500">営業担当課とその所属メンバー。顧客一覧（アプローチリスト）の担当課・担当者列に使用されます。</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {salesOrgMaster.map((s, si) => (
                <div key={s.section} className="rounded-lg border border-gray-100 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">{s.section}</p>
                  <div className="space-y-1">
                    {s.members.map((m, mi) => (
                      <div key={mi} className="flex items-center gap-1">
                        <input value={m} onChange={(e) => renameMember(si, mi, e.target.value)} className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm" />
                        <button onClick={() => removeMember(si, mi)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                    {s.members.length === 0 && <p className="text-xs text-slate-300">メンバー未登録</p>}
                  </div>
                  <button onClick={() => addMember(si)} className="mt-2 w-full rounded-lg border border-dashed border-gray-300 px-2 py-1 text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-500">＋ 追加</button>
                </div>
              ))}
            </div>
          </Card>
          )}

          {activeMaster === "規模別収益前提" && (
            <Card className="p-4">
              <h3 className="mb-1 text-base font-bold text-slate-700">規模別収益前提</h3>
              <p className="mb-3 text-xs text-slate-500">案件規模区分（小・中・大）ごとのライセンス見通し・年間保守見通し・プロジェクト期間の前提です。「案件規模」マスターのしきい値と組み合わせて、アプローチリストの見通し列に反映されます。</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-separate border-spacing-1 text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="w-16">規模</th><th>ライセンス見通し（M）</th><th>年間保守見通し（M）</th><th>プロジェクト期間（ヶ月）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[["small", "小"], ["medium", "中"], ["large", "大"]].map(([cat, label]) => (
                      <tr key={cat}>
                        <td className="font-semibold text-slate-600">{label}</td>
                        <td><input type="number" step="1" value={licenseForecastMaster[cat]} onChange={(e) => updateLicense(cat, e.target.value)} className="w-24 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                        <td><input type="number" step="1" value={maintenanceForecastMaster[cat]} onChange={(e) => updateMaintenanceForecast(cat, e.target.value)} className="w-24 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                        <td><input type="number" step="1" value={projectDurationMaster[cat]} onChange={(e) => updateDuration(cat, e.target.value)} className="w-24 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeMaster === "売上計上フェーズ" && (
            <Card className="p-4">
              <h3 className="mb-1 text-base font-bold text-slate-700">売上計上フェーズ</h3>
              <p className="mb-3 text-xs text-slate-500">案件規模（SI金額）とプロジェクト期間を、フェーズごとの期間比率・金額比率で配分します。比率の合計が100%になるようにしてください。</p>
              <div className="space-y-3">
                {revenuePhases.map((ph, i) => (
                  <div key={ph.name} className="rounded-lg border border-gray-100 p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-700">{ph.name}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-slate-500">
                        期間比率
                        <div className="mt-1 flex items-center gap-1">
                          <input type="number" step="5" value={Math.round(ph.durationRatio * 100)} onChange={(e) => updatePhase(i, "durationRatio", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
                          <span>%</span>
                        </div>
                      </label>
                      <label className="text-xs text-slate-500">
                        金額比率
                        <div className="mt-1 flex items-center gap-1">
                          <input type="number" step="5" value={Math.round(ph.amountRatio * 100)} onChange={(e) => updatePhase(i, "amountRatio", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
                          <span>%</span>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeMaster === "追加開発ルール" && (
            <Card className="p-4">
              <h3 className="mb-1 text-base font-bold text-slate-700">追加開発ルール</h3>
              <p className="mb-3 text-xs text-slate-500">本番稼働後、新規受注先への追加開発をいつから・どの頻度で狙うかの前提です。</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-500">
                  本番稼働からの開始タイミング
                  <div className="mt-1 flex items-center gap-1">
                    <input type="number" step="1" value={additionalDevRule.startAfterGoLiveMonths} onChange={(e) => setAdditionalDevRule((r) => ({ ...r, startAfterGoLiveMonths: Number(e.target.value) }))} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
                    <span>ヶ月後</span>
                  </div>
                </label>
                <label className="text-xs text-slate-500">
                  周期
                  <div className="mt-1 flex items-center gap-1">
                    <input type="number" step="1" value={additionalDevRule.cycleMonths} onChange={(e) => setAdditionalDevRule((r) => ({ ...r, cycleMonths: Number(e.target.value) }))} className="w-full rounded border border-gray-200 px-2 py-1 text-sm" />
                    <span>ヶ月ごと</span>
                  </div>
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">現在の前提：本番稼働の{additionalDevRule.startAfterGoLiveMonths}ヶ月後から、{additionalDevRule.cycleMonths}ヶ月ごと（毎年）に追加開発を狙う。アプローチリストの「追加開発開始」列に反映されます。</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== ルート ============================== */

export default function App() {
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [listFilter, setListFilter] = useState({});
  const [overrides, setOverrides] = useState({});
  const [customAdded, setCustomAdded] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [softDeletedIds, setSoftDeletedIds] = useState([]);

  const [industryMaster, setIndustryMaster] = useState(DEFAULT_INDUSTRY_MASTER);
  const [companySizeMaster, setCompanySizeMaster] = useState(DEFAULT_COMPANY_SIZE_MASTER);
  const [areaMaster, setAreaMaster] = useState(DEFAULT_AREA_MASTER);
  const [sizeThresholds, setSizeThresholds] = useState(DEFAULT_SIZE_THRESHOLDS);
  const [issueAttributeMaster, setIssueAttributeMaster] = useState(DEFAULT_ISSUE_ATTRIBUTE_MASTER);
  const [scopeMaster, setScopeMaster] = useState(DEFAULT_SCOPE_MASTER);
  const [productCharMaster, setProductCharMaster] = useState(DEFAULT_PRODUCT_CHAR_MASTER);
  const [expansionTypeMaster, setExpansionTypeMaster] = useState(DEFAULT_EXPANSION_TYPE_MASTER);
  const [maturityItemMaster, setMaturityItemMaster] = useState(DEFAULT_MATURITY_ITEM_MASTER);
  const [infoCompletenessMaster, setInfoCompletenessMaster] = useState(DEFAULT_INFO_COMPLETENESS_MASTER);
  const [policyMatrix, setPolicyMatrix] = useState(DEFAULT_POLICY_MATRIX);
  const [policyColorMaster, setPolicyColorMaster] = useState(DEFAULT_POLICY_COLOR_MASTER);
  const [salesOrgMaster, setSalesOrgMaster] = useState(DEFAULT_SALES_ORG_MASTER);
  const [licenseForecastMaster, setLicenseForecastMaster] = useState(DEFAULT_LICENSE_FORECAST);
  const [maintenanceForecastMaster, setMaintenanceForecastMaster] = useState(DEFAULT_MAINTENANCE_FORECAST);
  const [projectDurationMaster, setProjectDurationMaster] = useState(DEFAULT_PROJECT_DURATION);
  const [revenuePhases, setRevenuePhases] = useState(DEFAULT_REVENUE_PHASES);
  const [additionalDevRule, setAdditionalDevRule] = useState(DEFAULT_ADDITIONAL_DEV_RULE);

  const [selectedRevenueIds, setSelectedRevenueIds] = useState(null);

  // ---- 永続化：初回読み込み ----
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [savedOverrides, savedMasters, savedSelection, savedAdded, savedDeleted, savedSoftDeleted] = await Promise.all([
        storageGet(STORAGE_KEYS.overrides),
        storageGet(STORAGE_KEYS.masters),
        storageGet(STORAGE_KEYS.selection),
        storageGet(STORAGE_KEYS.added),
        storageGet(STORAGE_KEYS.deleted),
        storageGet(STORAGE_KEYS.softDeleted),
      ]);
      if (cancelled) return;
      if (savedOverrides) setOverrides(savedOverrides);
      if (savedAdded) setCustomAdded(savedAdded);
      if (savedDeleted) setDeletedIds(savedDeleted);
      if (savedSoftDeleted) setSoftDeletedIds(savedSoftDeleted);
      if (savedMasters) {
        if (savedMasters.industryMaster) setIndustryMaster(savedMasters.industryMaster);
        if (savedMasters.companySizeMaster) setCompanySizeMaster(savedMasters.companySizeMaster);
        if (savedMasters.areaMaster) setAreaMaster(savedMasters.areaMaster);
        if (savedMasters.sizeThresholds) setSizeThresholds(savedMasters.sizeThresholds);
        if (savedMasters.issueAttributeMaster) setIssueAttributeMaster(savedMasters.issueAttributeMaster);
        if (savedMasters.scopeMaster) setScopeMaster(savedMasters.scopeMaster);
        if (savedMasters.productCharMaster) setProductCharMaster(savedMasters.productCharMaster);
        if (savedMasters.expansionTypeMaster) setExpansionTypeMaster(savedMasters.expansionTypeMaster);
        if (savedMasters.maturityItemMaster) setMaturityItemMaster(savedMasters.maturityItemMaster);
        if (savedMasters.infoCompletenessMaster) setInfoCompletenessMaster(savedMasters.infoCompletenessMaster);
        if (savedMasters.policyMatrix) setPolicyMatrix(savedMasters.policyMatrix);
        if (savedMasters.policyColorMaster) setPolicyColorMaster(savedMasters.policyColorMaster);
        if (savedMasters.salesOrgMaster) setSalesOrgMaster(savedMasters.salesOrgMaster);
        if (savedMasters.licenseForecastMaster) setLicenseForecastMaster(savedMasters.licenseForecastMaster);
        if (savedMasters.maintenanceForecastMaster) setMaintenanceForecastMaster(savedMasters.maintenanceForecastMaster);
        if (savedMasters.projectDurationMaster) setProjectDurationMaster(savedMasters.projectDurationMaster);
        if (savedMasters.revenuePhases) setRevenuePhases(savedMasters.revenuePhases);
        if (savedMasters.additionalDevRule) setAdditionalDevRule(savedMasters.additionalDevRule);
      }
      if (savedSelection) setSelectedRevenueIds(savedSelection);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 永続化：変更を自動保存（デバウンス） ----
  const saveTimer = useRef(null);
  const scheduleSave = (fn) => {
    if (!hydrated) return; // 初回読み込み前の書き戻しを防ぐ
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      const ok = await fn();
      setSaveState(ok ? "saved" : "error");
    }, 600);
  };

  useEffect(() => {
    scheduleSave(() => storageSet(STORAGE_KEYS.overrides, overrides));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, hydrated]);

  useEffect(() => {
    scheduleSave(() => storageSet(STORAGE_KEYS.added, customAdded));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customAdded, hydrated]);

  useEffect(() => {
    scheduleSave(() => storageSet(STORAGE_KEYS.deleted, deletedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedIds, hydrated]);

  useEffect(() => {
    scheduleSave(() => storageSet(STORAGE_KEYS.softDeleted, softDeletedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [softDeletedIds, hydrated]);

  useEffect(() => {
    scheduleSave(() => storageSet(STORAGE_KEYS.masters, {
      industryMaster, companySizeMaster, areaMaster, sizeThresholds, issueAttributeMaster,
      scopeMaster, productCharMaster, expansionTypeMaster, maturityItemMaster, infoCompletenessMaster,
      policyMatrix, policyColorMaster, salesOrgMaster, licenseForecastMaster, maintenanceForecastMaster,
      projectDurationMaster, revenuePhases, additionalDevRule,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    industryMaster, companySizeMaster, areaMaster, sizeThresholds, issueAttributeMaster,
    scopeMaster, productCharMaster, expansionTypeMaster, maturityItemMaster, infoCompletenessMaster,
    policyMatrix, policyColorMaster, salesOrgMaster, licenseForecastMaster, maintenanceForecastMaster,
    projectDurationMaster, revenuePhases, additionalDevRule, hydrated,
  ]);

  useEffect(() => {
    if (selectedRevenueIds === null) return; // まだユーザーが選択していない（デフォルト状態）
    scheduleSave(() => storageSet(STORAGE_KEYS.selection, selectedRevenueIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRevenueIds, hydrated]);

  const resetAllData = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await storageDeleteAll();
    setOverrides({});
    setCustomAdded([]);
    setDeletedIds([]);
    setSoftDeletedIds([]);
    setIndustryMaster(DEFAULT_INDUSTRY_MASTER);
    setCompanySizeMaster(DEFAULT_COMPANY_SIZE_MASTER);
    setAreaMaster(DEFAULT_AREA_MASTER);
    setSizeThresholds(DEFAULT_SIZE_THRESHOLDS);
    setIssueAttributeMaster(DEFAULT_ISSUE_ATTRIBUTE_MASTER);
    setScopeMaster(DEFAULT_SCOPE_MASTER);
    setProductCharMaster(DEFAULT_PRODUCT_CHAR_MASTER);
    setExpansionTypeMaster(DEFAULT_EXPANSION_TYPE_MASTER);
    setMaturityItemMaster(DEFAULT_MATURITY_ITEM_MASTER);
    setInfoCompletenessMaster(DEFAULT_INFO_COMPLETENESS_MASTER);
    setPolicyMatrix(DEFAULT_POLICY_MATRIX);
    setPolicyColorMaster(DEFAULT_POLICY_COLOR_MASTER);
    setSalesOrgMaster(DEFAULT_SALES_ORG_MASTER);
    setLicenseForecastMaster(DEFAULT_LICENSE_FORECAST);
    setMaintenanceForecastMaster(DEFAULT_MAINTENANCE_FORECAST);
    setProjectDurationMaster(DEFAULT_PROJECT_DURATION);
    setRevenuePhases(DEFAULT_REVENUE_PHASES);
    setAdditionalDevRule(DEFAULT_ADDITIONAL_DEV_RULE);
    setSelectedRevenueIds(null);
    setSaveState("idle");
  };

  const masters = {
    industryMaster, setIndustryMaster,
    companySizeMaster, setCompanySizeMaster,
    areaMaster, setAreaMaster,
    sizeThresholds, setSizeThresholds,
    issueAttributeMaster, setIssueAttributeMaster,
    scopeMaster, setScopeMaster,
    productCharMaster, setProductCharMaster,
    expansionTypeMaster, setExpansionTypeMaster,
    maturityItemMaster, setMaturityItemMaster,
    infoCompletenessMaster, setInfoCompletenessMaster,
    policyMatrix, setPolicyMatrix,
    policyColorMaster, setPolicyColorMaster,
    salesOrgMaster, setSalesOrgMaster,
    licenseForecastMaster, setLicenseForecastMaster,
    maintenanceForecastMaster, setMaintenanceForecastMaster,
    projectDurationMaster, setProjectDurationMaster,
    revenuePhases, setRevenuePhases,
    additionalDevRule, setAdditionalDevRule,
    saveState, resetAllData,
  };

  const customers = useMemo(() => {
    const allRaw = [...RAW_CUSTOMERS, ...customAdded].filter((c) => !deletedIds.includes(c.id));
    return allRaw.map((c) => ({ ...deriveCustomer({ ...c, ...(overrides[c.id] || {}) }, masters), isSoftDeleted: softDeletedIds.includes(c.id) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, customAdded, deletedIds, softDeletedIds, industryMaster, companySizeMaster, areaMaster, sizeThresholds, maturityItemMaster, infoCompletenessMaster, policyMatrix, salesOrgMaster, licenseForecastMaster, maintenanceForecastMaster, projectDurationMaster, revenuePhases, additionalDevRule]);

  const openCustomer = (id) => { setSelectedId(id); setView("karte"); };
  const updateCustomer = (id, patch) => setOverrides((o) => ({ ...o, [id]: { ...(o[id] || {}), ...patch } }));
  const selected = customers.find((c) => c.id === selectedId);

  const addCustomer = () => {
    const maxId = Math.max(0, ...RAW_CUSTOMERS.map((c) => c.id), ...customAdded.map((c) => c.id));
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    const newCustomer = {
      id: maxId + 1, name: "新規企業", industry: industryMaster[0]?.name || "自動車部品",
      companyType: "部品メーカー・その他", isToyotaGroup: false, revenue: 800,
      areaTierId: areaMaster[0]?.id || "t1", areaDetail: "", fit: "○", expand: "○",
      siAmountM: 100, hasMaintenance: false, amountConfidence: "仮説", maturityLevel: 1,
      owner: salesOrgMaster[0]?.members[0] || "", prefecture: "", department: null, lastUpdated: dateStr,
    };
    setCustomAdded((arr) => [...arr, newCustomer]);
    return newCustomer.id;
  };
  const deleteCustomer = (id) => {
    if (softDeletedIds.includes(id)) {
      // 2回目：完全削除
      setDeletedIds((arr) => (arr.includes(id) ? arr : [...arr, id]));
      setSoftDeletedIds((arr) => arr.filter((x) => x !== id));
      setOverrides((o) => { const next = { ...o }; delete next[id]; return next; });
    } else {
      // 1回目：薄地表示にする（ターゲットマップからは除外）
      setSoftDeletedIds((arr) => (arr.includes(id) ? arr : [...arr, id]));
    }
  };
  const reviveCustomer = (id) => {
    setSoftDeletedIds((arr) => arr.filter((x) => x !== id));
  };

  const effectiveSelectedRevenueIds = selectedRevenueIds ?? customers.filter((c) => c.targetResult !== "対象外" && !c.isSoftDeleted).map((c) => c.id);

  return (
    <MasterContext.Provider value={masters}>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <NavBar view={view} setView={setView} onNavigate={(key) => { setListFilter({}); setView(key); }} saveState={saveState} />
        {view === "dashboard" && <Dashboard customers={customers} openCustomer={openCustomer} setView={setView} setListFilter={setListFilter} selectedRevenueIds={effectiveSelectedRevenueIds} />}
        {view === "list" && <CustomerList customers={customers} openCustomer={openCustomer} filter={listFilter} setFilter={setListFilter} updateCustomer={updateCustomer} addCustomer={addCustomer} deleteCustomer={deleteCustomer} reviveCustomer={reviveCustomer} />}
        {view === "karte" && selected && <CustomerKarte key={selected.id} customer={selected} updateCustomer={updateCustomer} back={() => setView("list")} />}
        {view === "review" && <ReviewScreen customers={customers} updateCustomer={updateCustomer} />}
        {view === "revenue" && <RevenuePlanScreen customers={customers} selectedRevenueIds={effectiveSelectedRevenueIds} setSelectedRevenueIds={setSelectedRevenueIds} />}
        {view === "framework" && <FrameworkPage />}
        {view === "master" && <MasterSettings />}
      </div>
    </MasterContext.Provider>
  );
}
