// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { UnstyledButton, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { type Element } from "../data/element";
import classes from "./PeriodicTable.module.css";

interface ElementCellProps {
  element: Element;
  onSelect: (element: Element) => void;
  // When true, render only the symbol (omit atomic number and name) for
  // legibility at small fit-scales. The aria-label and affordances are
  // unchanged, so selection stays identical in both modes.
  symbolOnly?: boolean;
  // Resolved cell background color, computed by the parent from the active
  // coloring scheme (see src/lib/cellColor.ts).
  color: string;
}

// One tappable element cell. Position-agnostic: the parent grid applies
// gridColumn/gridRow. Uses an UnstyledButton so it is keyboard- and
// touch-accessible with a comfortable minimum tap target (see CSS module).
export function ElementCell({ element, onSelect, symbolOnly = false, color }: ElementCellProps) {
  const { t } = useTranslation(["elements", "ui"]);
  // Translated name: reused for both the visible text and the accessible label
  // so a French cell never carries an English name in either.
  const name = t(`elements:name.${element.atomicNumber}`);
  return (
    <UnstyledButton
      className={classes.cell}
      aria-label={t("ui:cell.ariaLabel", {
        name,
        number: element.atomicNumber,
      })}
      style={{
        gridColumnStart: element.xpos,
        gridRowStart: element.ypos,
        backgroundColor: color,
      }}
      onClick={() => onSelect(element)}
    >
      {!symbolOnly && (
        <Text className={classes.number}>{element.atomicNumber}</Text>
      )}
      <Text className={classes.symbol}>{element.symbol}</Text>
      {!symbolOnly && (
        <Text className={classes.name} lineClamp={1}>
          {name}
        </Text>
      )}
    </UnstyledButton>
  );
}
