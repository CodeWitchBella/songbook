import type { DateTime } from "luxon";

import deti21 from "./deti21.png";
import deti22 from "./deti22.png";
import Deti23 from "./deti23";
import Deti24 from "./deti24.png";
import Deti25 from "./deti25.png";
import Vedouci24 from "./vedouci24.png";
import extra21 from "./extra21.png";
import vedouci21 from "./vedouci21.png";
import Vedouci22 from "./vedouci22";
import Vedouci23 from "./vedouci23";

const titleMap: {
  [key: string]: {
    title: string;
    subtitle: string;
    footer: string;
    imageViewHeight: number;
    imageViewPaddingTop: number;
    imageWidth?: number;
    imageOnly: boolean | [number, number];
    image?: string | ((props: any) => JSX.Element);
  };
} = {
  "Kačlehy 2020 Děti": {
    title: "Oslavné zpěvy",
    subtitle: "Panhellenský sněm 2020",
    footer: "Panhellenský sněm 2020",
    imageViewHeight: 36,
    imageViewPaddingTop: 3,
    imageWidth: undefined,
    imageOnly: false,
  },
  "Kačlehy 2020 Vedoucí": {
    title: "",
    subtitle: "",
    footer: "Kačlehopolis 2020",
    imageViewHeight: 50,
    imageViewPaddingTop: 0,
    imageWidth: undefined,
    imageOnly: true,
  },
  "Kačlehy 2021 Děti": {
    title: "Zpěvy ASAP",
    subtitle: "v2.0.21",
    footer: "Zpěvy ARGO Akademie™ v2.0.21",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: deti21,
  },
  "Kačlehy 2021 Vedoucí": {
    title: "Vesmírné zpěvy",
    subtitle: "v2.0.21",
    footer: "ARGO™ zpěvy v2.0.21",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: vedouci21,
  },
  "Kačlehy 2021 Extra": {
    title: "Krákorání",
    subtitle: "v2.0.21",
    footer: "Krákorání v2.0.21",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: extra21,
  },
  "Kačlehy 2022 Děti": {
    title: "Písně Aersgathské",
    subtitle: "MMXXII",
    footer: "Kačležský turnaj MMXXII",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    // source: https://blaedura-official.fandom.com/wiki/The_Weaver
    image: deti22,
  },
  "Kačlehy 2022 Vedoucí": {
    title: "Uctívání kedluben",
    subtitle: "MMXXII, 2. edice",
    footer: "Brehonští Sonomanceři MMXXII, 2. edice",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: Vedouci22,
  },
  "Tábor 2023 Vedoucí": {
    title: "Okultní zvuky",
    subtitle: "Brehoni 2023",
    footer: "Brehonské okultní zvuky 2023",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: Vedouci23,
  },
  "Tábor 2023 Děti": {
    title: "Posvátné zpěvy",
    subtitle: "MMXXIII",
    footer: "Brehoni 2023",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: Deti23,
  },
  "Tábor 2024 Děti": {
    title: "Zpěvník",
    subtitle: "Dědečkovy oblíbené písničky",
    footer: "Brehoni 2024",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: Deti24,
  },
  "Tábor 2024 Vedoucí": {
    title: "Zpěvník rady starších",
    subtitle: "Co už děda nemůže ani slyšet",
    footer: "Brehoni 2024",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: Vedouci24,
  },
  "Tábor 2025 Děti": {
    title: "Těžké melodično",
    subtitle: "",
    footer: "Brehoni 2025",
    imageViewHeight: 50,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: [100,100 / Math.sqrt(2)],
    image: Deti25,
  },
  "Tábor 2025 Bonus": {
    title: "Hudba s Kameny",
    subtitle: "",
    footer: "Brehoni 2025",
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
  }
};

function Brehoni() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="20" style={{ fill:'#263a78', fillOpacity:1 }}/>
  <path style={{ fill:"none", stroke:'#fff', strokeWidth:9.741, strokeDasharray:"none",strokeOpacity:1}} d="M34.08 45.27c0 20.287 16.764 36.733 37.444 36.733 5.859 0 11.635-1.349 16.376-3.102-1.605-18.619-18.012-33.833-37.875-33.833-19.86 0-36.266 15.21-37.875 33.83 4.74 1.756 10.517 3.104 16.376 3.105 20.68 0 37.444-16.446 37.444-36.732 0-12.386-6.363-23.938-15.945-30.726-9.582 6.788-15.945 18.34-15.945 30.726z"/>
</svg>

}

export function getSongbookMeta(title: string, time: DateTime) {
  return (
    titleMap[title] || {
      footer: "zpevnik.skorepova.info",
      imageViewHeight: 20,
      imageViewPaddingTop: 0,
      subtitle: time.setZone("local").toFormat("d. M. yyyy"),
      title,
      imageWidth: 20,
    }
  );
}
