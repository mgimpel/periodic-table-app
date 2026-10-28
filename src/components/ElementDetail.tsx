// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import {
  Badge,
  Box,
  Group,
  Image,
  ModalBaseTitle,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { CATEGORY_COLORS, type Element } from "../data/element";
import { elementImageUrl } from "../data/elementImages";
import { buildElectronShellDiagram } from "../lib/electronShellDiagram";
import { ResponsiveOverlay } from "./ResponsiveOverlay";

interface ElementDetailProps {
  element: Element | null;
  onClose: () => void;
}

// Format a nullable numeric field with an optional unit; "—" when unknown.
const fmt = (v: number | null, unit?: string | null) =>
  v === null ? "—" : unit ? `${v} ${unit}` : String(v);

// Element photo for the description tab. Rendered only when the element's
// English name has a matching bundled image.
function ElementImage({ element }: { element: Element }) {
  const { t } = useTranslation(["elements", "ui"]);
  const src = elementImageUrl(element.name);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={t("ui:detail.imageAlt", {
        name: t(`elements:name.${element.atomicNumber}`),
      })}
      w={160}
      h="auto"
      radius="md"
      fit="contain"
      flex="0 0 auto"
    />
  );
}

// Render the element's Bohr shell diagram. The pure generator returns an SVG
// string; embedding it as a data-URI <img> keeps the markup isolated (no inline
// DOM injection) and lets it scale responsively. Elements with no shells (none
// in the shipped data, but the field is a plain array) render nothing.
function ElectronShellDiagram({ element }: { element: Element }) {
  const { t } = useTranslation(["elements", "ui"]);
  if (element.shells.length === 0) return null;
  const svg = buildElectronShellDiagram(
    element.atomicNumber,
    element.symbol,
    element.electronConfigurationSemantic,
    element.shells,
    CATEGORY_COLORS[element.category],
  );
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return (
    <Image
      src={src}
      alt={t("ui:detail.shellDiagramAlt", {
        name: t(`elements:name.${element.atomicNumber}`),
      })}
      w={200}
      h={200}
      flex="0 0 auto"
    />
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Box>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Box>
  );
}

function DetailBody({ element }: { element: Element }) {
  const { t } = useTranslation(["elements", "ui"]);
  return (
    <Stack gap="md">
      <Group gap="sm" align="center">
        <Box
          w={32}
          h={32}
          bg={CATEGORY_COLORS[element.category]}
          c="#1a1a1a"
          bdrs="md"
          display="flex"
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Text fw={700} size="lg" lh={1} pt={4}>
            {element.symbol}
          </Text>
        </Box>
        <Group gap="xs" align="center">
          <Text span c="dimmed">
            {element.atomicNumber}
          </Text>
          {/* ponytail: rendering the heading as ModalBaseTitle registers it as
              the dialog's aria-labelledby target, so the dialog is named by the
              element name without moving it into the overlay title. Modal/Drawer
              don't forward aria-labelledby to the dialog element. Verified
              against Mantine 9.7.3; the dialog-name tests guard it. */}
          <Title
            order={2}
            size="h4"
            renderRoot={(props) => <ModalBaseTitle {...props} />}
          >
            {t(`elements:name.${element.atomicNumber}`)}
          </Title>
          <Badge variant="light" color="gray">
            {t(`ui:category.${element.category}`)}
          </Badge>
        </Group>
      </Group>

      <Tabs
        defaultValue="atomic"
        styles={{
          // Keep all tabs on one line without scrolling: let each tab shrink
          // and truncate its label with an ellipsis instead of overflowing.
          tab: {
            minWidth: 0,
            paddingInline: "var(--mantine-spacing-xs)",
          },
          tabLabel: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            // Nudge the label down so the full glyph height is visible.
            paddingTop: 2,
          },
        }}
      >
        <Tabs.List
          grow
          aria-label={t("ui:detail.sections")}
          style={{ flexWrap: "nowrap" }}
        >
          <Tabs.Tab value="atomic">{t("ui:detail.tab.atomic")}</Tabs.Tab>
          <Tabs.Tab value="physical">{t("ui:detail.tab.physical")}</Tabs.Tab>
          <Tabs.Tab value="electron">{t("ui:detail.tab.electron")}</Tabs.Tab>
          <Tabs.Tab value="description">{t("ui:detail.tab.description")}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="atomic" pt="md">
          <SimpleGrid cols={2} spacing="sm">
            <DetailRow
              label={t("ui:detail.field.atomicNumber")}
              value={element.atomicNumber}
            />
            <DetailRow
              label={t("ui:detail.field.atomicMass")}
              value={element.atomicMass}
            />
            <DetailRow
              label={t("ui:detail.field.group")}
              value={fmt(element.group)}
            />
            <DetailRow
              label={t("ui:detail.field.period")}
              value={element.period}
            />
            <DetailRow
              label={t("ui:detail.field.block")}
              value={element.block}
            />
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="physical" pt="md">
          <SimpleGrid cols={2} spacing="sm">
            <DetailRow
              label={t("ui:detail.field.phase")}
              value={t(`ui:phase.${element.phase}`, element.phase)}
            />
            <DetailRow
              label={t("ui:detail.field.density")}
              value={fmt(element.density, element.densityUnit)}
            />
            <DetailRow
              label={t("ui:detail.field.boil")}
              value={fmt(element.boil, "K")}
            />
            <DetailRow
              label={t("ui:detail.field.melt")}
              value={fmt(element.melt, "K")}
            />
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="electron" pt="md">
          <Group gap="md" align="flex-start" wrap="nowrap">
            <Stack gap="sm" flex={1} miw={0}>
              <DetailRow
                label={t("ui:detail.field.electronConfiguration")}
                value={element.electronConfiguration}
              />
              <DetailRow
                label={t("ui:detail.field.electronConfigurationSemantic")}
                value={element.electronConfigurationSemantic}
              />
              <DetailRow
                label={t("ui:detail.field.shells")}
                value={element.shells.join(", ")}
              />
              <DetailRow
                label={t("ui:detail.field.electronAffinity")}
                value={fmt(element.electronAffinity, "kJ/mol")}
              />
            </Stack>
            <ElectronShellDiagram element={element} />
          </Group>
        </Tabs.Panel>

        <Tabs.Panel value="description" pt="md">
          <Group gap="md" align="flex-start" wrap="nowrap">
            <Stack gap="sm" flex={1} miw={0}>
              {element.appearance && (
                <DetailRow
                  label={t("ui:detail.field.appearance")}
                  value={element.appearance}
                />
              )}
              {element.discoveredBy && (
                <DetailRow
                  label={t("ui:detail.field.discoveredBy")}
                  value={element.discoveredBy}
                />
              )}
              {element.namedBy && (
                <DetailRow
                  label={t("ui:detail.field.namedBy")}
                  value={element.namedBy}
                />
              )}
              <Text size="sm">
                {t(`elements:summary.${element.atomicNumber}`) ||
                  t("ui:detail.noDescription")}
              </Text>
            </Stack>
            <ElementImage element={element} />
          </Group>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

// Detail view for the selected element, in the shared ResponsiveOverlay
// (Drawer on mobile, Modal on desktop; both with a close button, overlay click
// and Esc). No overlay title: DetailBody's header names the dialog.
export function ElementDetail({ element, onClose }: ElementDetailProps) {
  return (
    <ResponsiveOverlay opened={element !== null} onClose={onClose}>
      {element && <DetailBody element={element} />}
    </ResponsiveOverlay>
  );
}
