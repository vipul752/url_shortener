import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 50 }, // ramp up
    { duration: "30s", target: 100 }, // stable
    { duration: "10s", target: 0 }, // ramp down
  ],
};

export default function () {
  http.post(
    "http://localhost:3000/shorten",
    JSON.stringify({
      url: "https://google.com",
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
