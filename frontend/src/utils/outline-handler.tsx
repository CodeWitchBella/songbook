import { useEffect } from "react";

export default function OutlineHandler() {
  useEffect(() => {
    const handleFirstTab = (e: any) => {
      if (e.keyCode === 9) {
        document.body.classList.add("keyboard");
        window.removeEventListener("keydown", handleFirstTab);
      }
    };
    window.addEventListener("keydown", handleFirstTab);
    return () => {
      document.body.classList.remove("keyboard");
      window.removeEventListener("keydown", handleFirstTab);
    };
  });

  // depends on outline handler section in index.css
  // TODO: move to :focus-visible
  return null;
}
