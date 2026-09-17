/**
 * Address Validation Utility for Indonesian Logistics & Couriers (Mengantar, JNE, J&T, SiCepat)
 * Memvalidasi kelengkapan alamat pembeli: nomor rumah/patokan, kecamatan, kelurahan, RT/RW.
 */

export interface AddressValidationResult {
  isValid: boolean;
  hasHouseNumber: boolean;
  hasSubdistrict: boolean;
  hasCity: boolean;
  hasStreetDetail: boolean;
  hasPostalCode: boolean;
  warnings: string[];
  missingFields: ('houseNumber' | 'subdistrict' | 'city' | 'streetDetail' | 'postalCode')[];
}

/**
 * Validasi alamat pembeli
 * @param address - Teks alamat jalan / detil tempat tinggal
 * @param subdistrict - Nama kecamatan (bisa terpisah atau sudah tercampur di address)
 * @param city - Nama kota/kabupaten
 * @param postalCode - Kode pos (opsional)
 */
export function validateIndonesianAddress(
  address: string = '',
  subdistrict: string = '',
  city: string = '',
  postalCode: string = ''
): AddressValidationResult {
  const cleanAddress = (address || '').trim();
  const cleanSubdistrict = (subdistrict || '').trim();
  const cleanCity = (city || '').trim();
  const cleanPostalCode = (postalCode || '').trim();

  const warnings: string[] = [];
  const missingFields: ('houseNumber' | 'subdistrict' | 'city' | 'streetDetail' | 'postalCode')[] = [];

  // 1. Cek Nomor Rumah / Blok / Patokan Bangunan
  // Contoh valid: "No. 12", "No 45B", "Blok A3", "Kavling 10", "RT 02 No 5", atau patokan: "depan masjid", "samping pos ronda"
  const hasDigitInAddress = /\d+/.test(cleanAddress);
  const hasHouseKeywords = /\b(no|nomor|blok|kav|kavling|gang|gg|unit|lantai|lt)\b/i.test(cleanAddress);
  const hasLandmarkKeywords = /\b(depan|sebelah|samping|seberang|dekat|belakang|masjid|musholla|mushola|pos\s*ronda|toko|warung|kantor|sekolah|gang)\b/i.test(cleanAddress);

  // Jika alamat punya angka (seperti No 12 atau RT 02 RW 05 No 3) ATAU kata kunci patokan spesifik
  const hasHouseNumber = (hasDigitInAddress && (hasHouseKeywords || /\d+[a-zA-Z]?\b/.test(cleanAddress))) || hasLandmarkKeywords;

  if (!hasHouseNumber) {
    missingFields.push('houseNumber');
    warnings.push('Nomor rumah atau patokan belum ada (contoh: No. 15, Blok B3, atau Depan Masjid Al-Ikhlas) agar kurir mudah menemukan rumah Anda.');
  }

  // 2. Cek Kecamatan
  // Bisa berasal dari input terpisah `cleanSubdistrict` ATAU tertulis di dalam `cleanAddress` (misal: "Kec. Tamansari")
  let hasValidSubdistrict = false;
  if (cleanSubdistrict.length >= 3) {
    // Pastikan bukan cuma kata "kecamatan" doang tanpa nama
    const normalized = cleanSubdistrict.toLowerCase().replace(/kecamatan|kec\.?/g, '').trim();
    if (normalized.length >= 2) {
      hasValidSubdistrict = true;
    }
  }

  // Cek apakah ada di dalam teks alamat jika input subdistrict kosong
  if (!hasValidSubdistrict) {
    const subdistrictInAddress = /\b(kec|kecamatan)\.?\s*([a-zA-Z\s]{3,})/i.test(cleanAddress);
    if (subdistrictInAddress) {
      hasValidSubdistrict = true;
    }
  }

  if (!hasValidSubdistrict) {
    missingFields.push('subdistrict');
    warnings.push('Kecamatan belum diisi secara lengkap (contoh: Kec. Tamansari). Kecamatan wajib diisi agar kurir dan ongkir tepat.');
  }

  // 3. Cek Kota / Kabupaten
  const hasCity = cleanCity.length >= 3 || /\b(kota|kab|kabupaten)\b/i.test(cleanAddress);
  if (!hasCity) {
    missingFields.push('city');
    warnings.push('Kota / Kabupaten belum diisi (contoh: Kota Tasikmalaya).');
  }

  // 4. Cek Kelayakan Panjang Alamat Jalan (Street Detail)
  // Kurir sering kesulitan jika pembeli hanya menulis "Jl. Mawar" (terlalu pendek)
  const hasStreetDetail = cleanAddress.length >= 10;
  if (!hasStreetDetail) {
    missingFields.push('streetDetail');
    warnings.push('Alamat terlalu singkat. Mohon cantumkan nama jalan, RT/RW, atau kelurahan/desa secara lengkap.');
  }

  // 5. Cek Kode Pos (jika ada input kode pos tapi kurang dari 5 digit)
  let hasPostalCode = true;
  if (cleanPostalCode && !/^\d{5}$/.test(cleanPostalCode)) {
    hasPostalCode = false;
    missingFields.push('postalCode');
    warnings.push('Kode pos Indonesia biasanya terdiri dari 5 angka (contoh: 46196).');
  }

  // Alamat dianggap VALID jika minimal memiliki:
  // 1. Nomor Rumah / Patokan
  // 2. Kecamatan
  // 3. Detail jalan yang memadai (minimal 10 karakter)
  const isValid = hasHouseNumber && hasValidSubdistrict && hasStreetDetail;

  return {
    isValid,
    hasHouseNumber,
    hasSubdistrict: hasValidSubdistrict,
    hasCity,
    hasStreetDetail,
    hasPostalCode,
    warnings,
    missingFields
  };
}
