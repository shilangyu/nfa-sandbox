import { setupCounter } from "./counter.ts";
import "./style.css";

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
