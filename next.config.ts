import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents를 끄는 이유: 켜면 이전 화면의 상태(대화 내용 등)가 재사용되어
  // 새 대화를 시작해도 이전 대화가 남아 있는 문제가 생김.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
