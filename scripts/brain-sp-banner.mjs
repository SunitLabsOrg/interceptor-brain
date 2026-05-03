#!/usr/bin/env node
/**
 * Red FIGlet-style "BRAIN SP" banner for npm lifecycle hooks.
 * ANSI colors only when stdout is a TTY and NO_COLOR is unset.
 */
import process from "node:process";

const RED = "\x1b[31m";
const RESET = "\x1b[0m";

/** Standard FIGlet font output for "BRAIN SP" (figlet v1.7.0). */
const BANNER = [
  "  ____  ____      _    ___ _   _   ____  ____  ",
  " | __ )|  _ \\    / \\  |_ _| \\ | | / ___||  _ \\ ",
  " |  _ \\| |_) |  / _ \\  | ||  \\| | \\___ \\| |_) |",
  " | |_) |  _ <  / ___ \\ | || |\\  |  ___) |  __/ ",
  " |____/|_| \\_\\/_/   \\_\\___|_| \\_| |____/|_|    ",
  "                                                "
].join("\n");

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const block = `${useColor ? RED : ""}${BANNER}${useColor ? RESET : ""}`;

process.stdout.write(`\n${block}\n\n`);
