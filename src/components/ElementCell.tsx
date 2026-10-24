// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { UnstyledButton, Text } from "@mantine/core";
import { CATEGORY_COLORS, type Element } from "../data/element";
import classes from "./PeriodicTable.module.css";

interface ElementCellProps {
  element: Element;
  onSelect: (element: Element) => void;
}

// One tappable element cell. Position-agnostic: the parent grid applies
// gridColumn/gridRow. Uses an UnstyledButton so it is keyboard- and
// touch-accessible with a comfortable minimum tap target (see CSS module).
export function ElementCell({ element, onSelect }: ElementCellProps) {
  return (
    <UnstyledButton
      className={classes.cell}
      aria-label={`${element.name}, atomic number ${element.atomicNumber}`}
      style={{
        gridColumnStart: element.xpos,
        gridRowStart: element.ypos,
        backgroundColor: CATEGORY_COLORS[element.category],
      }}
      onClick={() => onSelect(element)}
    >
      <Text className={classes.number}>{element.atomicNumber}</Text>
      <Text className={classes.symbol}>{element.symbol}</Text>
      <Text className={classes.name} lineClamp={1}>
        {element.name}
      </Text>
    </UnstyledButton>
  );
}
