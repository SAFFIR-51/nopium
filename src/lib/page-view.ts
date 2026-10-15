"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Full page views use URL identifiers; patient/record contents never go in the URL. */
export function usePageState<T>(name: string, parse: (id: string) => T | null, serialize: (value: T) => string, legacy?: string, subject?: string): [T | null, (value: T | null) => void] {
  const params = useSearchParams(), pathname = usePathname(), router = useRouter();
  const active = params.get("view") === name;
  const value = active ? parse(params.get("item") || "") : !params.has("view") && legacy ? parse(legacy) : null;
  const base = () => {
    const query = new URLSearchParams(params.toString());
    for (const key of ["view", "item", "back", "patient", "subject"]) query.delete(key);
    return pathname + (query.size ? `?${query}` : "");
  };
  const set = (next: T | null) => {
    const back = params.get("back"), fallback = base();
    const destination = back?.startsWith(pathname + "?") || back === pathname ? back : fallback;
    if (next === null || next === "") { router.replace(destination, { scroll: true }); return; }
    const query = new URLSearchParams(params.toString());
    query.delete("patient"); query.set("view", name); query.set("item", serialize(next)); query.set("back", destination);
    if (subject) query.set("subject", subject);
    router.push(`${pathname}?${query}`, { scroll: true });
  };
  return [value, set];
}
export function usePageValue<T extends string>(name: string, legacy?: T, subject?: string) {
  return usePageState<T>(name, id => id as T, String, legacy, subject);
}
export function usePageFlag(name: string, subject?: string): [boolean, (value: boolean) => void] {
  const [value, set] = usePageState(name, () => true, () => "open", undefined, subject);
  return [!!value, value => set(value ? true : null)];
}
export function usePageItem<T>(name: string, items: readonly T[], identify: (value: T) => string, legacy?: string) {
  return usePageState(name, id => items.find(value => identify(value) === id) ?? null, identify, legacy);
}
