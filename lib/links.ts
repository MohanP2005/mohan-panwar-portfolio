export function linkProps(url: string): { target?: "_blank"; rel?: string } {
  if (/^https?:\/\//i.test(url)) {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return {};
}
