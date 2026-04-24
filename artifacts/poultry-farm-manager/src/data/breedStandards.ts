export interface BreedStandard {
  id: string;
  name: string;
  type: "layer" | "broiler";
  housing: string;
  source: string;
  rearingData: RearingWeekData[];
  productionData: ProductionWeekData[];
}

export interface RearingWeekData {
  weekAge: number; // 1-18
  dayRange: string; // e.g., "0-7"
  feedIntakeMin: number; // g/bird/day min
  feedIntakeMax: number; // g/bird/day max
  feedCumMin: number; // g cumulative min
  feedCumMax: number; // g cumulative max
  bodyWeightMin: number; // g min
  bodyWeightMax: number; // g max
}

export interface ProductionWeekData {
  weekAge: number; // 18-100
  layPercent: number; // % Lay (hen day)
  eggWeight: number; // g
  eggMassPerDay: number; // g
  feedIntakePerDay: number; // g
  feedConversionWeekly: number;
  eggsCumPerHenHoused: number;
  eggMassCumKg: number;
  feedIntakeCumKg: number;
  feedConversionCum: number;
  livabilityPercent: number;
  bodyWeight: number; // g
  gradingS: number; // % < 53g
  gradingM: number; // % 53-63g
  gradingL: number; // % 63-73g
  gradingXL: number; // % > 73g
}

export const BREED_STANDARDS: BreedStandard[] = [
  {
    id: "bovans-white",
    name: "Bovans White",
    type: "layer",
    housing: "cage",
    source: "Hendrix Genetics Product Guide L1211-1a (Cage housing)",
    rearingData: [
      { weekAge: 1, dayRange: "0-7", feedIntakeMin: 8, feedIntakeMax: 10, feedCumMin: 56, feedCumMax: 70, bodyWeightMin: 59, bodyWeightMax: 62 },
      { weekAge: 2, dayRange: "8-14", feedIntakeMin: 13, feedIntakeMax: 15, feedCumMin: 147, feedCumMax: 175, bodyWeightMin: 117, bodyWeightMax: 123 },
      { weekAge: 3, dayRange: "15-21", feedIntakeMin: 19, feedIntakeMax: 21, feedCumMin: 280, feedCumMax: 322, bodyWeightMin: 190, bodyWeightMax: 200 },
      { weekAge: 4, dayRange: "22-28", feedIntakeMin: 24, feedIntakeMax: 26, feedCumMin: 448, feedCumMax: 504, bodyWeightMin: 258, bodyWeightMax: 272 },
      { weekAge: 5, dayRange: "29-35", feedIntakeMin: 29, feedIntakeMax: 31, feedCumMin: 651, feedCumMax: 721, bodyWeightMin: 332, bodyWeightMax: 349 },
      { weekAge: 6, dayRange: "36-42", feedIntakeMin: 34, feedIntakeMax: 36, feedCumMin: 889, feedCumMax: 973, bodyWeightMin: 410, bodyWeightMax: 431 },
      { weekAge: 7, dayRange: "43-49", feedIntakeMin: 39, feedIntakeMax: 41, feedCumMin: 1162, feedCumMax: 1260, bodyWeightMin: 488, bodyWeightMax: 513 },
      { weekAge: 8, dayRange: "50-56", feedIntakeMin: 43, feedIntakeMax: 45, feedCumMin: 1463, feedCumMax: 1575, bodyWeightMin: 566, bodyWeightMax: 595 },
      { weekAge: 9, dayRange: "57-63", feedIntakeMin: 46, feedIntakeMax: 48, feedCumMin: 1785, feedCumMax: 1911, bodyWeightMin: 644, bodyWeightMax: 677 },
      { weekAge: 10, dayRange: "64-70", feedIntakeMin: 49, feedIntakeMax: 51, feedCumMin: 2128, feedCumMax: 2268, bodyWeightMin: 722, bodyWeightMax: 759 },
      { weekAge: 11, dayRange: "71-77", feedIntakeMin: 52, feedIntakeMax: 54, feedCumMin: 2492, feedCumMax: 2646, bodyWeightMin: 795, bodyWeightMax: 835 },
      { weekAge: 12, dayRange: "78-84", feedIntakeMin: 55, feedIntakeMax: 57, feedCumMin: 2877, feedCumMax: 3045, bodyWeightMin: 873, bodyWeightMax: 917 },
      { weekAge: 13, dayRange: "85-91", feedIntakeMin: 58, feedIntakeMax: 60, feedCumMin: 3283, feedCumMax: 3465, bodyWeightMin: 936, bodyWeightMax: 984 },
      { weekAge: 14, dayRange: "92-98", feedIntakeMin: 61, feedIntakeMax: 63, feedCumMin: 3710, feedCumMax: 3906, bodyWeightMin: 1004, bodyWeightMax: 1056 },
      { weekAge: 15, dayRange: "99-105", feedIntakeMin: 64, feedIntakeMax: 66, feedCumMin: 4158, feedCumMax: 4368, bodyWeightMin: 1068, bodyWeightMax: 1122 },
      { weekAge: 16, dayRange: "106-112", feedIntakeMin: 67, feedIntakeMax: 69, feedCumMin: 4627, feedCumMax: 4851, bodyWeightMin: 1121, bodyWeightMax: 1179 },
      { weekAge: 17, dayRange: "113-119", feedIntakeMin: 72, feedIntakeMax: 74, feedCumMin: 5131, feedCumMax: 5369, bodyWeightMin: 1175, bodyWeightMax: 1235 },
      { weekAge: 18, dayRange: "120-126", feedIntakeMin: 77, feedIntakeMax: 79, feedCumMin: 5673, feedCumMax: 5925, bodyWeightMin: 1219, bodyWeightMax: 1281 },
    ],
    productionData: [
      { weekAge: 18, layPercent: 3.0, eggWeight: 40.1, eggMassPerDay: 1.2, feedIntakePerDay: 78, feedConversionWeekly: 65.17, eggsCumPerHenHoused: 0, eggMassCumKg: 0.0, feedIntakeCumKg: 0.5, feedConversionCum: 65.17, livabilityPercent: 99.9, bodyWeight: 1250, gradingS: 100.0, gradingM: 0.0, gradingL: 0.0, gradingXL: 0.0 },
      { weekAge: 19, layPercent: 13.2, eggWeight: 43.0, eggMassPerDay: 5.7, feedIntakePerDay: 84, feedConversionWeekly: 14.79, eggsCumPerHenHoused: 1, eggMassCumKg: 0.0, feedIntakeCumKg: 1.1, feedConversionCum: 23.60, livabilityPercent: 99.8, bodyWeight: 1310, gradingS: 99.8, gradingM: 0.2, gradingL: 0.0, gradingXL: 0.0 },
      { weekAge: 20, layPercent: 44.5, eggWeight: 46.1, eggMassPerDay: 20.5, feedIntakePerDay: 89, feedConversionWeekly: 4.33, eggsCumPerHenHoused: 4, eggMassCumKg: 0.2, feedIntakeCumKg: 1.8, feedConversionCum: 9.18, livabilityPercent: 99.7, bodyWeight: 1370, gradingS: 96.8, gradingM: 3.2, gradingL: 0.0, gradingXL: 0.0 },
      { weekAge: 21, layPercent: 67.6, eggWeight: 48.6, eggMassPerDay: 32.9, feedIntakePerDay: 93, feedConversionWeekly: 2.83, eggsCumPerHenHoused: 9, eggMassCumKg: 0.4, feedIntakeCumKg: 2.4, feedConversionCum: 5.72, livabilityPercent: 99.7, bodyWeight: 1445, gradingS: 86.9, gradingM: 13.1, gradingL: 0.0, gradingXL: 0.0 },
      { weekAge: 22, layPercent: 82.4, eggWeight: 50.8, eggMassPerDay: 41.9, feedIntakePerDay: 97, feedConversionWeekly: 2.32, eggsCumPerHenHoused: 15, eggMassCumKg: 0.7, feedIntakeCumKg: 3.1, feedConversionCum: 4.32, livabilityPercent: 99.6, bodyWeight: 1495, gradingS: 70.2, gradingM: 29.6, gradingL: 0.1, gradingXL: 0.0 },
      { weekAge: 23, layPercent: 91.1, eggWeight: 52.7, eggMassPerDay: 48.1, feedIntakePerDay: 100, feedConversionWeekly: 2.07, eggsCumPerHenHoused: 21, eggMassCumKg: 1.0, feedIntakeCumKg: 3.8, feedConversionCum: 3.60, livabilityPercent: 99.5, bodyWeight: 1530, gradingS: 52.5, gradingM: 46.8, gradingL: 0.8, gradingXL: 0.0 },
      { weekAge: 24, layPercent: 94.8, eggWeight: 54.4, eggMassPerDay: 51.6, feedIntakePerDay: 102, feedConversionWeekly: 1.98, eggsCumPerHenHoused: 28, eggMassCumKg: 1.4, feedIntakeCumKg: 4.5, feedConversionCum: 3.19, livabilityPercent: 99.4, bodyWeight: 1550, gradingS: 37.0, gradingM: 60.5, gradingL: 2.5, gradingXL: 0.0 },
      { weekAge: 25, layPercent: 95.6, eggWeight: 55.7, eggMassPerDay: 53.3, feedIntakePerDay: 104, feedConversionWeekly: 1.95, eggsCumPerHenHoused: 34, eggMassCumKg: 1.8, feedIntakeCumKg: 5.2, feedConversionCum: 2.93, livabilityPercent: 99.3, bodyWeight: 1565, gradingS: 26.9, gradingM: 67.9, gradingL: 5.2, gradingXL: 0.0 },
      { weekAge: 26, layPercent: 96.1, eggWeight: 56.7, eggMassPerDay: 54.5, feedIntakePerDay: 105, feedConversionWeekly: 1.93, eggsCumPerHenHoused: 41, eggMassCumKg: 2.2, feedIntakeCumKg: 5.9, feedConversionCum: 2.75, livabilityPercent: 99.2, bodyWeight: 1580, gradingS: 20.5, gradingM: 71.1, gradingL: 8.4, gradingXL: 0.0 },
      { weekAge: 27, layPercent: 96.4, eggWeight: 57.6, eggMassPerDay: 55.6, feedIntakePerDay: 106, feedConversionWeekly: 1.91, eggsCumPerHenHoused: 48, eggMassCumKg: 2.5, feedIntakeCumKg: 6.7, feedConversionCum: 2.63, livabilityPercent: 99.2, bodyWeight: 1590, gradingS: 15.7, gradingM: 72.0, gradingL: 12.2, gradingXL: 0.0 },
      { weekAge: 28, layPercent: 96.6, eggWeight: 58.3, eggMassPerDay: 56.3, feedIntakePerDay: 107, feedConversionWeekly: 1.91, eggsCumPerHenHoused: 54, eggMassCumKg: 2.9, feedIntakeCumKg: 7.4, feedConversionCum: 2.53, livabilityPercent: 99.1, bodyWeight: 1602, gradingS: 12.6, gradingM: 71.5, gradingL: 15.8, gradingXL: 0.1 },
      { weekAge: 29, layPercent: 96.7, eggWeight: 58.9, eggMassPerDay: 57.0, feedIntakePerDay: 108, feedConversionWeekly: 1.90, eggsCumPerHenHoused: 61, eggMassCumKg: 3.3, feedIntakeCumKg: 8.2, feedConversionCum: 2.46, livabilityPercent: 99.0, bodyWeight: 1608, gradingS: 10.4, gradingM: 70.2, gradingL: 19.3, gradingXL: 0.1 },
      { weekAge: 30, layPercent: 96.8, eggWeight: 59.4, eggMassPerDay: 57.5, feedIntakePerDay: 109, feedConversionWeekly: 1.90, eggsCumPerHenHoused: 68, eggMassCumKg: 3.7, feedIntakeCumKg: 8.9, feedConversionCum: 2.40, livabilityPercent: 98.9, bodyWeight: 1616, gradingS: 8.8, gradingM: 68.5, gradingL: 22.5, gradingXL: 0.2 },
      { weekAge: 31, layPercent: 97.0, eggWeight: 59.8, eggMassPerDay: 57.9, feedIntakePerDay: 110, feedConversionWeekly: 1.89, eggsCumPerHenHoused: 74, eggMassCumKg: 4.1, feedIntakeCumKg: 9.7, feedConversionCum: 2.35, livabilityPercent: 98.8, bodyWeight: 1621, gradingS: 7.7, gradingM: 66.9, gradingL: 25.2, gradingXL: 0.3 },
      { weekAge: 32, layPercent: 96.9, eggWeight: 60.1, eggMassPerDay: 58.2, feedIntakePerDay: 110, feedConversionWeekly: 1.89, eggsCumPerHenHoused: 81, eggMassCumKg: 4.5, feedIntakeCumKg: 10.4, feedConversionCum: 2.31, livabilityPercent: 98.7, bodyWeight: 1626, gradingS: 6.9, gradingM: 65.5, gradingL: 27.2, gradingXL: 0.4 },
      { weekAge: 33, layPercent: 96.8, eggWeight: 60.3, eggMassPerDay: 58.4, feedIntakePerDay: 110, feedConversionWeekly: 1.88, eggsCumPerHenHoused: 88, eggMassCumKg: 4.9, feedIntakeCumKg: 11.2, feedConversionCum: 2.27, livabilityPercent: 98.7, bodyWeight: 1629, gradingS: 6.4, gradingM: 64.5, gradingL: 28.6, gradingXL: 0.4 },
      { weekAge: 34, layPercent: 96.7, eggWeight: 60.5, eggMassPerDay: 58.5, feedIntakePerDay: 110, feedConversionWeekly: 1.88, eggsCumPerHenHoused: 94, eggMassCumKg: 5.3, feedIntakeCumKg: 12.0, feedConversionCum: 2.24, livabilityPercent: 98.6, bodyWeight: 1632, gradingS: 6.0, gradingM: 63.5, gradingL: 30.0, gradingXL: 0.5 },
      { weekAge: 35, layPercent: 96.6, eggWeight: 60.7, eggMassPerDay: 58.6, feedIntakePerDay: 110, feedConversionWeekly: 1.88, eggsCumPerHenHoused: 101, eggMassCumKg: 5.7, feedIntakeCumKg: 12.7, feedConversionCum: 2.22, livabilityPercent: 98.5, bodyWeight: 1635, gradingS: 5.6, gradingM: 62.5, gradingL: 31.3, gradingXL: 0.6 },
      { weekAge: 36, layPercent: 96.5, eggWeight: 60.9, eggMassPerDay: 58.7, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 108, eggMassCumKg: 6.1, feedIntakeCumKg: 13.5, feedConversionCum: 2.19, livabilityPercent: 98.4, bodyWeight: 1638, gradingS: 5.3, gradingM: 61.5, gradingL: 32.5, gradingXL: 0.6 },
      { weekAge: 37, layPercent: 96.4, eggWeight: 61.0, eggMassPerDay: 58.8, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 114, eggMassCumKg: 6.5, feedIntakeCumKg: 14.2, feedConversionCum: 2.17, livabilityPercent: 98.3, bodyWeight: 1641, gradingS: 5.0, gradingM: 60.6, gradingL: 33.7, gradingXL: 0.7 },
      { weekAge: 38, layPercent: 96.2, eggWeight: 61.2, eggMassPerDay: 58.9, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 121, eggMassCumKg: 7.0, feedIntakeCumKg: 15.0, feedConversionCum: 2.16, livabilityPercent: 98.2, bodyWeight: 1644, gradingS: 4.7, gradingM: 59.7, gradingL: 34.8, gradingXL: 0.8 },
      { weekAge: 39, layPercent: 96.1, eggWeight: 61.3, eggMassPerDay: 58.9, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 128, eggMassCumKg: 7.4, feedIntakeCumKg: 15.8, feedConversionCum: 2.14, livabilityPercent: 98.2, bodyWeight: 1647, gradingS: 4.5, gradingM: 58.8, gradingL: 35.8, gradingXL: 0.9 },
      { weekAge: 40, layPercent: 95.9, eggWeight: 61.5, eggMassPerDay: 58.9, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 134, eggMassCumKg: 7.8, feedIntakeCumKg: 16.5, feedConversionCum: 2.13, livabilityPercent: 98.1, bodyWeight: 1650, gradingS: 4.3, gradingM: 58.0, gradingL: 36.8, gradingXL: 0.9 },
      { weekAge: 41, layPercent: 95.8, eggWeight: 61.6, eggMassPerDay: 59.0, feedIntakePerDay: 110, feedConversionWeekly: 1.86, eggsCumPerHenHoused: 141, eggMassCumKg: 8.2, feedIntakeCumKg: 17.3, feedConversionCum: 2.11, livabilityPercent: 98.0, bodyWeight: 1652, gradingS: 4.1, gradingM: 57.3, gradingL: 37.6, gradingXL: 1.0 },
      { weekAge: 42, layPercent: 95.6, eggWeight: 61.7, eggMassPerDay: 59.0, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 147, eggMassCumKg: 8.6, feedIntakeCumKg: 18.0, feedConversionCum: 2.10, livabilityPercent: 97.9, bodyWeight: 1654, gradingS: 3.9, gradingM: 56.6, gradingL: 38.4, gradingXL: 1.1 },
      { weekAge: 43, layPercent: 95.4, eggWeight: 61.8, eggMassPerDay: 58.9, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 154, eggMassCumKg: 9.0, feedIntakeCumKg: 18.8, feedConversionCum: 2.09, livabilityPercent: 97.8, bodyWeight: 1656, gradingS: 3.8, gradingM: 55.9, gradingL: 39.2, gradingXL: 1.2 },
      { weekAge: 44, layPercent: 95.3, eggWeight: 61.9, eggMassPerDay: 59.0, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 160, eggMassCumKg: 9.4, feedIntakeCumKg: 19.5, feedConversionCum: 2.08, livabilityPercent: 97.7, bodyWeight: 1658, gradingS: 3.6, gradingM: 55.3, gradingL: 39.8, gradingXL: 1.2 },
      { weekAge: 45, layPercent: 95.1, eggWeight: 62.0, eggMassPerDay: 58.9, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 167, eggMassCumKg: 9.8, feedIntakeCumKg: 20.3, feedConversionCum: 2.07, livabilityPercent: 97.6, bodyWeight: 1660, gradingS: 3.5, gradingM: 54.7, gradingL: 40.5, gradingXL: 1.3 },
      { weekAge: 46, layPercent: 94.9, eggWeight: 62.1, eggMassPerDay: 58.9, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 173, eggMassCumKg: 10.2, feedIntakeCumKg: 21.0, feedConversionCum: 2.06, livabilityPercent: 97.6, bodyWeight: 1661, gradingS: 3.4, gradingM: 54.1, gradingL: 41.1, gradingXL: 1.4 },
      { weekAge: 47, layPercent: 94.6, eggWeight: 62.1, eggMassPerDay: 58.8, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 180, eggMassCumKg: 10.6, feedIntakeCumKg: 21.8, feedConversionCum: 2.06, livabilityPercent: 97.5, bodyWeight: 1662, gradingS: 3.3, gradingM: 53.6, gradingL: 41.7, gradingXL: 1.4 },
      { weekAge: 48, layPercent: 94.4, eggWeight: 62.2, eggMassPerDay: 58.8, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 186, eggMassCumKg: 11.0, feedIntakeCumKg: 22.5, feedConversionCum: 2.05, livabilityPercent: 97.4, bodyWeight: 1663, gradingS: 3.2, gradingM: 53.0, gradingL: 42.3, gradingXL: 1.5 },
      { weekAge: 49, layPercent: 94.2, eggWeight: 62.3, eggMassPerDay: 58.7, feedIntakePerDay: 110, feedConversionWeekly: 1.87, eggsCumPerHenHoused: 193, eggMassCumKg: 11.4, feedIntakeCumKg: 23.3, feedConversionCum: 2.04, livabilityPercent: 97.3, bodyWeight: 1664, gradingS: 3.1, gradingM: 52.5, gradingL: 42.8, gradingXL: 1.6 },
      { weekAge: 50, layPercent: 93.9, eggWeight: 62.4, eggMassPerDay: 58.6, feedIntakePerDay: 110, feedConversionWeekly: 1.88, eggsCumPerHenHoused: 199, eggMassCumKg: 11.8, feedIntakeCumKg: 24.0, feedConversionCum: 2.04, livabilityPercent: 97.2, bodyWeight: 1665, gradingS: 3.0, gradingM: 52.0, gradingL: 43.3, gradingXL: 1.7 },
      { weekAge: 51, layPercent: 93.7, eggWeight: 62.4, eggMassPerDay: 58.5, feedIntakePerDay: 110, feedConversionWeekly: 1.88, eggsCumPerHenHoused: 205, eggMassCumKg: 12.2, feedIntakeCumKg: 24.8, feedConversionCum: 2.03, livabilityPercent: 97.1, bodyWeight: 1666, gradingS: 2.9, gradingM: 51.5, gradingL: 43.8, gradingXL: 1.7 },
      { weekAge: 52, layPercent: 93.4, eggWeight: 62.5, eggMassPerDay: 58.4, feedIntakePerDay: 110, feedConversionWeekly: 1.88, eggsCumPerHenHoused: 212, eggMassCumKg: 12.6, feedIntakeCumKg: 25.5, feedConversionCum: 2.03, livabilityPercent: 97.1, bodyWeight: 1667, gradingS: 2.9, gradingM: 51.0, gradingL: 44.3, gradingXL: 1.8 },
      { weekAge: 53, layPercent: 93.2, eggWeight: 62.6, eggMassPerDay: 58.3, feedIntakePerDay: 110, feedConversionWeekly: 1.89, eggsCumPerHenHoused: 218, eggMassCumKg: 13.0, feedIntakeCumKg: 26.3, feedConversionCum: 2.02, livabilityPercent: 97.0, bodyWeight: 1668, gradingS: 2.8, gradingM: 50.6, gradingL: 44.7, gradingXL: 1.9 },
      { weekAge: 54, layPercent: 92.9, eggWeight: 62.6, eggMassPerDay: 58.2, feedIntakePerDay: 110, feedConversionWeekly: 1.89, eggsCumPerHenHoused: 224, eggMassCumKg: 13.4, feedIntakeCumKg: 27.0, feedConversionCum: 2.02, livabilityPercent: 96.9, bodyWeight: 1669, gradingS: 2.7, gradingM: 50.2, gradingL: 45.1, gradingXL: 1.9 },
      { weekAge: 55, layPercent: 92.7, eggWeight: 62.7, eggMassPerDay: 58.1, feedIntakePerDay: 110, feedConversionWeekly: 1.89, eggsCumPerHenHoused: 231, eggMassCumKg: 13.8, feedIntakeCumKg: 27.8, feedConversionCum: 2.02, livabilityPercent: 96.8, bodyWeight: 1670, gradingS: 2.7, gradingM: 49.8, gradingL: 45.5, gradingXL: 2.0 },
      { weekAge: 56, layPercent: 92.4, eggWeight: 62.7, eggMassPerDay: 58.0, feedIntakePerDay: 110, feedConversionWeekly: 1.90, eggsCumPerHenHoused: 237, eggMassCumKg: 14.2, feedIntakeCumKg: 28.5, feedConversionCum: 2.01, livabilityPercent: 96.7, bodyWeight: 1671, gradingS: 2.6, gradingM: 49.4, gradingL: 45.9, gradingXL: 2.0 },
      { weekAge: 57, layPercent: 92.1, eggWeight: 62.8, eggMassPerDay: 57.8, feedIntakePerDay: 110, feedConversionWeekly: 1.90, eggsCumPerHenHoused: 243, eggMassCumKg: 14.5, feedIntakeCumKg: 29.2, feedConversionCum: 2.01, livabilityPercent: 96.6, bodyWeight: 1672, gradingS: 2.6, gradingM: 49.1, gradingL: 46.2, gradingXL: 2.1 },
      { weekAge: 58, layPercent: 91.8, eggWeight: 62.8, eggMassPerDay: 57.7, feedIntakePerDay: 110, feedConversionWeekly: 1.91, eggsCumPerHenHoused: 249, eggMassCumKg: 14.9, feedIntakeCumKg: 30.0, feedConversionCum: 2.01, livabilityPercent: 96.6, bodyWeight: 1673, gradingS: 2.5, gradingM: 48.8, gradingL: 46.6, gradingXL: 2.2 },
      { weekAge: 59, layPercent: 91.5, eggWeight: 62.9, eggMassPerDay: 57.6, feedIntakePerDay: 110, feedConversionWeekly: 1.91, eggsCumPerHenHoused: 256, eggMassCumKg: 15.3, feedIntakeCumKg: 30.7, feedConversionCum: 2.01, livabilityPercent: 96.5, bodyWeight: 1674, gradingS: 2.5, gradingM: 48.5, gradingL: 46.8, gradingXL: 2.2 },
      { weekAge: 60, layPercent: 91.2, eggWeight: 62.9, eggMassPerDay: 57.4, feedIntakePerDay: 110, feedConversionWeekly: 1.92, eggsCumPerHenHoused: 262, eggMassCumKg: 15.7, feedIntakeCumKg: 31.5, feedConversionCum: 2.00, livabilityPercent: 96.4, bodyWeight: 1675, gradingS: 2.4, gradingM: 48.2, gradingL: 47.1, gradingXL: 2.3 },
      { weekAge: 61, layPercent: 90.9, eggWeight: 63.0, eggMassPerDay: 57.3, feedIntakePerDay: 110, feedConversionWeekly: 1.92, eggsCumPerHenHoused: 268, eggMassCumKg: 16.1, feedIntakeCumKg: 32.2, feedConversionCum: 2.00, livabilityPercent: 96.3, bodyWeight: 1676, gradingS: 2.4, gradingM: 47.9, gradingL: 47.4, gradingXL: 2.3 },
      { weekAge: 62, layPercent: 90.6, eggWeight: 63.0, eggMassPerDay: 57.1, feedIntakePerDay: 110, feedConversionWeekly: 1.93, eggsCumPerHenHoused: 274, eggMassCumKg: 16.5, feedIntakeCumKg: 33.0, feedConversionCum: 2.00, livabilityPercent: 96.2, bodyWeight: 1677, gradingS: 2.4, gradingM: 47.7, gradingL: 47.6, gradingXL: 2.3 },
      { weekAge: 63, layPercent: 90.3, eggWeight: 63.0, eggMassPerDay: 56.9, feedIntakePerDay: 110, feedConversionWeekly: 1.93, eggsCumPerHenHoused: 280, eggMassCumKg: 16.9, feedIntakeCumKg: 33.7, feedConversionCum: 2.00, livabilityPercent: 96.1, bodyWeight: 1678, gradingS: 2.3, gradingM: 47.5, gradingL: 47.8, gradingXL: 2.4 },
      { weekAge: 64, layPercent: 90.0, eggWeight: 63.1, eggMassPerDay: 56.7, feedIntakePerDay: 110, feedConversionWeekly: 1.94, eggsCumPerHenHoused: 286, eggMassCumKg: 17.2, feedIntakeCumKg: 34.4, feedConversionCum: 2.00, livabilityPercent: 96.1, bodyWeight: 1679, gradingS: 2.3, gradingM: 47.3, gradingL: 48.0, gradingXL: 2.4 },
      { weekAge: 65, layPercent: 89.6, eggWeight: 63.1, eggMassPerDay: 56.5, feedIntakePerDay: 110, feedConversionWeekly: 1.95, eggsCumPerHenHoused: 292, eggMassCumKg: 17.6, feedIntakeCumKg: 35.2, feedConversionCum: 2.00, livabilityPercent: 96.0, bodyWeight: 1680, gradingS: 2.3, gradingM: 47.1, gradingL: 48.1, gradingXL: 2.5 },
      { weekAge: 66, layPercent: 89.3, eggWeight: 63.1, eggMassPerDay: 56.3, feedIntakePerDay: 110, feedConversionWeekly: 1.95, eggsCumPerHenHoused: 298, eggMassCumKg: 18.0, feedIntakeCumKg: 35.9, feedConversionCum: 1.99, livabilityPercent: 95.9, bodyWeight: 1681, gradingS: 2.3, gradingM: 47.0, gradingL: 48.2, gradingXL: 2.5 },
      { weekAge: 67, layPercent: 89.0, eggWeight: 63.1, eggMassPerDay: 56.1, feedIntakePerDay: 110, feedConversionWeekly: 1.96, eggsCumPerHenHoused: 304, eggMassCumKg: 18.4, feedIntakeCumKg: 36.6, feedConversionCum: 1.99, livabilityPercent: 95.8, bodyWeight: 1682, gradingS: 2.3, gradingM: 46.9, gradingL: 48.4, gradingXL: 2.5 },
      { weekAge: 68, layPercent: 88.6, eggWeight: 63.1, eggMassPerDay: 55.9, feedIntakePerDay: 110, feedConversionWeekly: 1.97, eggsCumPerHenHoused: 310, eggMassCumKg: 18.8, feedIntakeCumKg: 37.4, feedConversionCum: 1.99, livabilityPercent: 95.7, bodyWeight: 1683, gradingS: 2.3, gradingM: 46.8, gradingL: 48.4, gradingXL: 2.5 },
      { weekAge: 69, layPercent: 88.3, eggWeight: 63.1, eggMassPerDay: 55.7, feedIntakePerDay: 110, feedConversionWeekly: 1.97, eggsCumPerHenHoused: 316, eggMassCumKg: 19.1, feedIntakeCumKg: 38.1, feedConversionCum: 1.99, livabilityPercent: 95.6, bodyWeight: 1684, gradingS: 2.2, gradingM: 46.7, gradingL: 48.5, gradingXL: 2.5 },
      { weekAge: 70, layPercent: 87.9, eggWeight: 63.1, eggMassPerDay: 55.5, feedIntakePerDay: 110, feedConversionWeekly: 1.98, eggsCumPerHenHoused: 322, eggMassCumKg: 19.5, feedIntakeCumKg: 38.9, feedConversionCum: 1.99, livabilityPercent: 95.5, bodyWeight: 1685, gradingS: 2.2, gradingM: 46.7, gradingL: 48.6, gradingXL: 2.5 },
      { weekAge: 71, layPercent: 87.5, eggWeight: 63.2, eggMassPerDay: 55.3, feedIntakePerDay: 110, feedConversionWeekly: 1.99, eggsCumPerHenHoused: 328, eggMassCumKg: 19.9, feedIntakeCumKg: 39.6, feedConversionCum: 1.99, livabilityPercent: 95.5, bodyWeight: 1686, gradingS: 2.2, gradingM: 46.6, gradingL: 48.6, gradingXL: 2.6 },
      { weekAge: 72, layPercent: 87.2, eggWeight: 63.2, eggMassPerDay: 55.1, feedIntakePerDay: 110, feedConversionWeekly: 2.00, eggsCumPerHenHoused: 333, eggMassCumKg: 20.2, feedIntakeCumKg: 40.3, feedConversionCum: 1.99, livabilityPercent: 95.4, bodyWeight: 1687, gradingS: 2.2, gradingM: 46.5, gradingL: 48.7, gradingXL: 2.6 },
      { weekAge: 73, layPercent: 86.8, eggWeight: 63.2, eggMassPerDay: 54.8, feedIntakePerDay: 110, feedConversionWeekly: 2.01, eggsCumPerHenHoused: 339, eggMassCumKg: 20.6, feedIntakeCumKg: 41.1, feedConversionCum: 1.99, livabilityPercent: 95.3, bodyWeight: 1688, gradingS: 2.2, gradingM: 46.4, gradingL: 48.8, gradingXL: 2.6 },
      { weekAge: 74, layPercent: 86.3, eggWeight: 63.2, eggMassPerDay: 54.5, feedIntakePerDay: 110, feedConversionWeekly: 2.02, eggsCumPerHenHoused: 345, eggMassCumKg: 21.0, feedIntakeCumKg: 41.8, feedConversionCum: 1.99, livabilityPercent: 95.2, bodyWeight: 1689, gradingS: 2.2, gradingM: 46.4, gradingL: 48.8, gradingXL: 2.6 },
      { weekAge: 75, layPercent: 85.9, eggWeight: 63.2, eggMassPerDay: 54.3, feedIntakePerDay: 110, feedConversionWeekly: 2.03, eggsCumPerHenHoused: 351, eggMassCumKg: 21.3, feedIntakeCumKg: 42.5, feedConversionCum: 1.99, livabilityPercent: 95.1, bodyWeight: 1690, gradingS: 2.2, gradingM: 46.3, gradingL: 48.9, gradingXL: 2.6 },
      { weekAge: 76, layPercent: 85.6, eggWeight: 63.2, eggMassPerDay: 54.1, feedIntakePerDay: 110, feedConversionWeekly: 2.03, eggsCumPerHenHoused: 356, eggMassCumKg: 21.7, feedIntakeCumKg: 43.3, feedConversionCum: 1.99, livabilityPercent: 95.0, bodyWeight: 1691, gradingS: 2.2, gradingM: 46.2, gradingL: 48.9, gradingXL: 2.6 },
      { weekAge: 77, layPercent: 85.2, eggWeight: 63.2, eggMassPerDay: 53.8, feedIntakePerDay: 110, feedConversionWeekly: 2.04, eggsCumPerHenHoused: 362, eggMassCumKg: 22.0, feedIntakeCumKg: 44.0, feedConversionCum: 2.00, livabilityPercent: 95.0, bodyWeight: 1692, gradingS: 2.2, gradingM: 46.2, gradingL: 49.0, gradingXL: 2.6 },
      { weekAge: 78, layPercent: 84.8, eggWeight: 63.2, eggMassPerDay: 53.6, feedIntakePerDay: 110, feedConversionWeekly: 2.05, eggsCumPerHenHoused: 368, eggMassCumKg: 22.4, feedIntakeCumKg: 44.7, feedConversionCum: 2.00, livabilityPercent: 94.9, bodyWeight: 1693, gradingS: 2.2, gradingM: 46.1, gradingL: 49.1, gradingXL: 2.7 },
      { weekAge: 79, layPercent: 84.4, eggWeight: 63.2, eggMassPerDay: 53.4, feedIntakePerDay: 110, feedConversionWeekly: 2.06, eggsCumPerHenHoused: 373, eggMassCumKg: 22.8, feedIntakeCumKg: 45.5, feedConversionCum: 2.00, livabilityPercent: 94.8, bodyWeight: 1694, gradingS: 2.2, gradingM: 46.0, gradingL: 49.1, gradingXL: 2.7 },
      { weekAge: 80, layPercent: 84.0, eggWeight: 63.2, eggMassPerDay: 53.1, feedIntakePerDay: 110, feedConversionWeekly: 2.07, eggsCumPerHenHoused: 379, eggMassCumKg: 23.1, feedIntakeCumKg: 46.2, feedConversionCum: 2.00, livabilityPercent: 94.7, bodyWeight: 1695, gradingS: 2.1, gradingM: 46.0, gradingL: 49.2, gradingXL: 2.7 },
      { weekAge: 81, layPercent: 83.6, eggWeight: 63.3, eggMassPerDay: 52.9, feedIntakePerDay: 110, feedConversionWeekly: 2.08, eggsCumPerHenHoused: 384, eggMassCumKg: 23.5, feedIntakeCumKg: 46.9, feedConversionCum: 2.00, livabilityPercent: 94.6, bodyWeight: 1696, gradingS: 2.1, gradingM: 45.9, gradingL: 49.3, gradingXL: 2.7 },
      { weekAge: 82, layPercent: 83.2, eggWeight: 63.3, eggMassPerDay: 52.7, feedIntakePerDay: 110, feedConversionWeekly: 2.09, eggsCumPerHenHoused: 390, eggMassCumKg: 23.8, feedIntakeCumKg: 47.6, feedConversionCum: 2.00, livabilityPercent: 94.5, bodyWeight: 1697, gradingS: 2.1, gradingM: 45.8, gradingL: 49.3, gradingXL: 2.7 },
      { weekAge: 83, layPercent: 82.9, eggWeight: 63.3, eggMassPerDay: 52.4, feedIntakePerDay: 110, feedConversionWeekly: 2.10, eggsCumPerHenHoused: 395, eggMassCumKg: 24.2, feedIntakeCumKg: 48.4, feedConversionCum: 2.00, livabilityPercent: 94.5, bodyWeight: 1698, gradingS: 2.1, gradingM: 45.8, gradingL: 49.4, gradingXL: 2.7 },
      { weekAge: 84, layPercent: 82.5, eggWeight: 63.3, eggMassPerDay: 52.2, feedIntakePerDay: 110, feedConversionWeekly: 2.11, eggsCumPerHenHoused: 401, eggMassCumKg: 24.5, feedIntakeCumKg: 49.1, feedConversionCum: 2.00, livabilityPercent: 94.4, bodyWeight: 1699, gradingS: 2.1, gradingM: 45.7, gradingL: 49.5, gradingXL: 2.7 },
      { weekAge: 85, layPercent: 82.1, eggWeight: 63.3, eggMassPerDay: 52.0, feedIntakePerDay: 110, feedConversionWeekly: 2.12, eggsCumPerHenHoused: 406, eggMassCumKg: 24.8, feedIntakeCumKg: 49.8, feedConversionCum: 2.01, livabilityPercent: 94.3, bodyWeight: 1700, gradingS: 2.1, gradingM: 45.6, gradingL: 49.5, gradingXL: 2.8 },
      { weekAge: 86, layPercent: 81.7, eggWeight: 63.3, eggMassPerDay: 51.7, feedIntakePerDay: 110, feedConversionWeekly: 2.13, eggsCumPerHenHoused: 412, eggMassCumKg: 25.2, feedIntakeCumKg: 50.5, feedConversionCum: 2.01, livabilityPercent: 94.2, bodyWeight: 1700, gradingS: 2.1, gradingM: 45.5, gradingL: 49.6, gradingXL: 2.8 },
      { weekAge: 87, layPercent: 81.3, eggWeight: 63.3, eggMassPerDay: 51.5, feedIntakePerDay: 110, feedConversionWeekly: 2.14, eggsCumPerHenHoused: 417, eggMassCumKg: 25.5, feedIntakeCumKg: 51.3, feedConversionCum: 2.01, livabilityPercent: 94.1, bodyWeight: 1700, gradingS: 2.1, gradingM: 45.5, gradingL: 49.7, gradingXL: 2.8 },
      { weekAge: 88, layPercent: 80.9, eggWeight: 63.3, eggMassPerDay: 51.2, feedIntakePerDay: 110, feedConversionWeekly: 2.15, eggsCumPerHenHoused: 422, eggMassCumKg: 25.9, feedIntakeCumKg: 52.0, feedConversionCum: 2.01, livabilityPercent: 94.0, bodyWeight: 1700, gradingS: 2.1, gradingM: 45.4, gradingL: 49.7, gradingXL: 2.8 },
      { weekAge: 89, layPercent: 80.6, eggWeight: 63.3, eggMassPerDay: 51.0, feedIntakePerDay: 110, feedConversionWeekly: 2.16, eggsCumPerHenHoused: 428, eggMassCumKg: 26.2, feedIntakeCumKg: 52.7, feedConversionCum: 2.01, livabilityPercent: 94.0, bodyWeight: 1700, gradingS: 2.1, gradingM: 45.3, gradingL: 49.8, gradingXL: 2.8 },
      { weekAge: 90, layPercent: 80.2, eggWeight: 63.3, eggMassPerDay: 50.8, feedIntakePerDay: 110, feedConversionWeekly: 2.17, eggsCumPerHenHoused: 433, eggMassCumKg: 26.5, feedIntakeCumKg: 53.4, feedConversionCum: 2.01, livabilityPercent: 93.9, bodyWeight: 1700, gradingS: 2.1, gradingM: 45.3, gradingL: 49.8, gradingXL: 2.8 },
      { weekAge: 91, layPercent: 79.8, eggWeight: 63.4, eggMassPerDay: 50.6, feedIntakePerDay: 110, feedConversionWeekly: 2.18, eggsCumPerHenHoused: 438, eggMassCumKg: 26.9, feedIntakeCumKg: 54.2, feedConversionCum: 2.02, livabilityPercent: 93.8, bodyWeight: 1700, gradingS: 2.1, gradingM: 45.2, gradingL: 49.9, gradingXL: 2.8 },
      { weekAge: 92, layPercent: 79.4, eggWeight: 63.4, eggMassPerDay: 50.3, feedIntakePerDay: 110, feedConversionWeekly: 2.19, eggsCumPerHenHoused: 443, eggMassCumKg: 27.2, feedIntakeCumKg: 54.9, feedConversionCum: 2.02, livabilityPercent: 93.7, bodyWeight: 1700, gradingS: 2.0, gradingM: 45.1, gradingL: 50.0, gradingXL: 2.9 },
      { weekAge: 93, layPercent: 79.1, eggWeight: 63.4, eggMassPerDay: 50.1, feedIntakePerDay: 110, feedConversionWeekly: 2.20, eggsCumPerHenHoused: 449, eggMassCumKg: 27.5, feedIntakeCumKg: 55.6, feedConversionCum: 2.02, livabilityPercent: 93.6, bodyWeight: 1700, gradingS: 2.0, gradingM: 45.1, gradingL: 50.0, gradingXL: 2.9 },
      { weekAge: 94, layPercent: 78.7, eggWeight: 63.4, eggMassPerDay: 49.9, feedIntakePerDay: 110, feedConversionWeekly: 2.21, eggsCumPerHenHoused: 454, eggMassCumKg: 27.8, feedIntakeCumKg: 56.3, feedConversionCum: 2.02, livabilityPercent: 93.5, bodyWeight: 1700, gradingS: 2.0, gradingM: 45.0, gradingL: 50.1, gradingXL: 2.9 },
      { weekAge: 95, layPercent: 78.3, eggWeight: 63.4, eggMassPerDay: 49.7, feedIntakePerDay: 110, feedConversionWeekly: 2.21, eggsCumPerHenHoused: 459, eggMassCumKg: 28.2, feedIntakeCumKg: 57.0, feedConversionCum: 2.02, livabilityPercent: 93.4, bodyWeight: 1700, gradingS: 2.0, gradingM: 44.9, gradingL: 50.2, gradingXL: 2.9 },
      { weekAge: 96, layPercent: 78.0, eggWeight: 63.4, eggMassPerDay: 49.5, feedIntakePerDay: 110, feedConversionWeekly: 2.22, eggsCumPerHenHoused: 464, eggMassCumKg: 28.5, feedIntakeCumKg: 57.8, feedConversionCum: 2.03, livabilityPercent: 93.4, bodyWeight: 1700, gradingS: 2.0, gradingM: 44.8, gradingL: 50.2, gradingXL: 2.9 },
      { weekAge: 97, layPercent: 77.7, eggWeight: 63.4, eggMassPerDay: 49.2, feedIntakePerDay: 110, feedConversionWeekly: 2.23, eggsCumPerHenHoused: 469, eggMassCumKg: 28.8, feedIntakeCumKg: 58.5, feedConversionCum: 2.03, livabilityPercent: 93.3, bodyWeight: 1700, gradingS: 2.0, gradingM: 44.8, gradingL: 50.3, gradingXL: 2.9 },
      { weekAge: 98, layPercent: 77.3, eggWeight: 63.4, eggMassPerDay: 49.0, feedIntakePerDay: 110, feedConversionWeekly: 2.24, eggsCumPerHenHoused: 474, eggMassCumKg: 29.1, feedIntakeCumKg: 59.2, feedConversionCum: 2.03, livabilityPercent: 93.2, bodyWeight: 1700, gradingS: 2.0, gradingM: 44.7, gradingL: 50.3, gradingXL: 2.9 },
      { weekAge: 99, layPercent: 77.0, eggWeight: 63.4, eggMassPerDay: 48.8, feedIntakePerDay: 110, feedConversionWeekly: 2.25, eggsCumPerHenHoused: 479, eggMassCumKg: 29.5, feedIntakeCumKg: 59.9, feedConversionCum: 2.03, livabilityPercent: 93.1, bodyWeight: 1700, gradingS: 2.0, gradingM: 44.6, gradingL: 50.4, gradingXL: 3.0 },
      { weekAge: 100, layPercent: 76.7, eggWeight: 63.4, eggMassPerDay: 48.6, feedIntakePerDay: 110, feedConversionWeekly: 2.26, eggsCumPerHenHoused: 484, eggMassCumKg: 29.8, feedIntakeCumKg: 60.6, feedConversionCum: 2.04, livabilityPercent: 93.0, bodyWeight: 1700, gradingS: 2.0, gradingM: 44.6, gradingL: 50.5, gradingXL: 3.0 },
    ],
  },
];

export function getBreedStandard(id: string): BreedStandard | undefined {
  return BREED_STANDARDS.find((b) => b.id === id);
}

export function getStandardForWeek(
  breedId: string,
  weekAge: number
): ProductionWeekData | undefined {
  const breed = getBreedStandard(breedId);
  if (!breed) return undefined;
  return breed.productionData.find((w) => w.weekAge === weekAge);
}

