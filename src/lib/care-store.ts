"use client";
// 하위 호환 모듈. 새 코드는 "@/lib/repo"의 careRepo와 useCare를 사용하세요.
import { careRepo } from "./repo";

export type { CareStatus, Patient, CareRecord, Report, Assessment, CareState } from "./repo";
export { useCare } from "./repo";
export { seed } from "./repo/seed";

export const updateCare: typeof careRepo.update = fn => careRepo.update(fn);
export const resetCare = () => careRepo.reset();
export const changePatient: typeof careRepo.changePatient = (id, patch) => careRepo.changePatient(id, patch);
export const addPatient: typeof careRepo.addPatient = patient => careRepo.addPatient(patient);
