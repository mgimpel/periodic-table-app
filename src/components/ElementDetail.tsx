// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import {
  Badge,
  Box,
  Drawer,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { CATEGORY_COLORS, type Element } from "../data/element";
import { buildElectronShellDiagram } from "../lib/electronShellDiagram";

interface ElementDetailProps {
  element: Element | null;
  onClose: () => void;
}

// Bundle the element photos (keyed by English element name, e.g. "Hydrogen").
// import.meta.glob with eager+url is Vite's native way to ship a whole asset
// folder and map it by filename — no runtime fetch, no new dependency. Not every
// element has a photo; missing names resolve to undefined and the image is
// simply omitted.
const ELEMENT_IMAGES = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../assets/images/*.webp", {
      eager: true,
      import: "default",
      query: "?url",
    }),
  ).map(([path, url]) => [
    path.slice(path.lastIndexOf("/") + 1, -".webp".length),
    url,
  ]),
) as Record<string, string>;

// Element photo for the description tab. Rendered only when the element's
// English name has a matching bundled image.
function ElementImage({ element }: { element: Element }) {
  const { t } = useTranslation(["elements", "ui"]);
  const src = ELEMENT_IMAGES[element.name];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={t("ui:detail.imageAlt", {
        name: t(`elements:name.${element.atomicNumber}`),
      })}
      width={160}
      style={{
        flex: "0 0 auto",
        width: 160,
        height: "auto",
        borderRadius: 8,
        objectFit: "contain",
      }}
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
    <img
      src={src}
      alt={t("ui:detail.shellDiagramAlt", {
        name: t(`elements:name.${element.atomicNumber}`),
      })}
      width={200}
      height={200}
      style={{ flex: "0 0 auto" }}
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
          style={{
            backgroundColor: CATEGORY_COLORS[element.category],
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1a1a1a",
          }}
        >
          <Text fw={700} size="lg" style={{ lineHeight: 1, paddingTop: 4 }}>
            {element.symbol}
          </Text>
        </Box>
        <Group gap="xs" align="center">
          <Text span c="dimmed">
            {element.atomicNumber}
          </Text>
          <Title order={2} size="h4">
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
              value={element.group ?? "—"}
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
              value={element.phase}
            />
            <DetailRow
              label={t("ui:detail.field.density")}
              value={
                element.density !== null
                  ? `${element.density}${
                      element.densityUnit ? ` ${element.densityUnit}` : ""
                    }`
                  : "—"
              }
            />
            <DetailRow
              label={t("ui:detail.field.boil")}
              value={element.boil !== null ? `${element.boil} K` : "—"}
            />
            <DetailRow
              label={t("ui:detail.field.melt")}
              value={element.melt !== null ? `${element.melt} K` : "—"}
            />
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="electron" pt="md">
          <Group gap="md" align="flex-start" wrap="nowrap">
            <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
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
                value={
                  element.electronAffinity !== null
                    ? `${element.electronAffinity} kJ/mol`
                    : "—"
                }
              />
            </Stack>
            <ElectronShellDiagram element={element} />
          </Group>
        </Tabs.Panel>

        <Tabs.Panel value="description" pt="md">
          <Group gap="md" align="flex-start" wrap="nowrap">
            <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
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

// Detail view for the selected element. Mobile-first: a bottom-anchored Drawer
// on small screens, a centered Modal from the `sm` breakpoint up. Both are
// dismissable (close button, overlay click, Esc).
export function ElementDetail({ element, onClose }: ElementDetailProps) {
  const { t } = useTranslation("ui");
  const isWide = useMediaQuery("(min-width: 48em)");
  const opened = element !== null;

  if (isWide) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        centered
        size="lg"
        withCloseButton={false}
      >
        {element && <DetailBody element={element} />}
      </Modal>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="80%"
      closeButtonProps={{ "aria-label": t("common.close") }}
    >
      {element && <DetailBody element={element} />}
    </Drawer>
  );
}
