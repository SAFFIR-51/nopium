"use client";
import { useSyncExternalStore } from "react";
import { localRepository } from "./local-repository";
import { DEMO_MODE } from "../session";
import { serverRepository, type ClientRepository } from "./server-repository";

export * from "./types";
export { todayLocal } from "./local-repository";

/** 체험 저장소와 서버 저장소를 빌드 모드에 맞춰 선택합니다. */
export const careRepo: ClientRepository = DEMO_MODE ? localRepository : serverRepository;

export function useCare() {
  return useSyncExternalStore(careRepo.subscribe, careRepo.getSnapshot, careRepo.getServerSnapshot);
}

/** 서버 저장 실패 시 입력·모달을 유지합니다. 체험 저장의 void 반환은 성공으로 취급합니다. */
export const mutationFailed = (result: unknown) => result === false;
