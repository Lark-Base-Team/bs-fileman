"use client";
import {
  Col,
  Image,
  Row,
  Spin,
  Empty,
  Badge,
  Toast,
  Switch,
  Typography,
  Button,
  Dropdown,
  Descriptions,
  Upload,
  Notification,
} from "@douyinfe/semi-ui";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
  IllustrationConstruction,
  IllustrationConstructionDark,
} from "@douyinfe/semi-illustrations";

import styles from "./index.module.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getFileTypeIconAsUrl } from "@fluentui/react-file-type-icons";
import {
  canvasToFile,
  fileToIOpenAttachment,
  fileToURL,
  base64ToFile,
  downloadFile,
  urlToFile,
  smartFileSizeDisplay,
  smartTimestampDisplay,
  fileExt,
  copyText,
  splitFilename,
} from "../../utils/shared";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { arrayMoveImmutable } from "array-move";
import SortableList, { SortableItem } from "react-easy-sort";
import useModal from "../../components/useModal";
import { createPortal } from "react-dom";
import useMenu from "../../components/useMenu";
import { FieldType } from "@lark-base-open/js-sdk";
import { getFileTypeIconProps } from "@fluentui/react-file-type-icons";
import { IconBolt, IconFilledArrowUp } from "@douyinfe/semi-icons";

let base: any = null;
let bridge: any = null;
let table: any = null;
let lang: string = "zh";
let inited = false;

type Selected = {
  field: any;
  select: any;
  selectFiles: { val: any; url: any }[];
};

if (typeof window !== "undefined") {
  window.devicePixelRatio = window.devicePixelRatio * 4;
}

const defaultConf = {
  fullMode: false,
  previewMode: false,
};

const storeConf =
  typeof localStorage !== "undefined"
    ? JSON.parse(localStorage.getItem("conf") || JSON.stringify(defaultConf))
    : defaultConf;

export default function Home() {
  const { Text } = Typography;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(-1);
  const [conf, setConf] = useState<typeof defaultConf>(storeConf);
  const [selected, setSelected] = useState<Selected | undefined>(undefined);
  const [isAttachment, setIsAttachment] = useState(false);
  const [nextWin, setNextWin] = useState<Window | undefined>(undefined);
  const [t, i18n] = useTranslation();
  const { alertInput, alert } = useModal();
  const { popup, params } = useMenu();
  const uploadRef = useRef();

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("conf", JSON.stringify(conf));
    }
  }, [conf]);

  const setConfMerge = useCallback(
    (conf: Partial<typeof defaultConf>) => {
      setConf((conft: any) => ({ ...conft, ...conf }));
    },
    [setConf]
  );

  const onSelectChange = useCallback(async () => {
    setLoading(true);
    // lock.current = true;
    try {
      const selected: Selected = {
        field: null,
        select: null,
        selectFiles: [],
      };
      const select = await base.getSelection();
      const field: any = await table.getField(select.fieldId);
      if ((await field.getType()) !== FieldType.Attachment) {
        setIsAttachment(false);
        setLoading(false);
        return setSelected(undefined);
      }
      setIsAttachment(true);
      // const cell = await field.getCell(select.recordId);
      const urls = storeConf.previewMode
        ? (await field
            .getAttachmentUrls(select.recordId)
            .catch((err: any) => console.log(err), [])) || []
        : [];
      // const urls =
      // (await field
      //   .getAttachmentThumbnailUrls(select.recordId)
      //   .catch((err: any) => console.log(err), [])) || [];

      const vals =
        (await field
          .getValue(select.recordId)
          .catch((err: any) => console.log(err), [])) || [];

      selected.field = field;
      selected.select = select;
      vals.map((val: any, i: string | number) => {
        selected.selectFiles.push({
          val,
          url: urls[i],
        });
      });

      if (current > selected.selectFiles.length - 1) {
        setCurrent(-1);
      }
      console.log(selected);

      setSelected(selected);
    } catch (error) {
      setSelected(undefined);
      console.error(error);
    }
    setLoading(false);
  }, [current]);
  const onSelectionChangeRef = useRef(onSelectChange);
  onSelectionChangeRef.current = onSelectChange;

  const init = useCallback(async () => {
    if (inited) {
      return;
    }
    inited = true;
    // setLoading(true);
    const { bitable } = await import("@lark-base-open/js-sdk");
    table = await bitable.base.getActiveTable();
    base = (table as any).base;
    bridge = (bitable as any).bridge;
    base.onSelectionChange(() => onSelectionChangeRef.current());
    lang = await bridge.getLanguage();
    // i18n.changeLanguage(lang);
    await onSelectionChangeRef.current();
    setLoading(false);
  }, []);
  useEffect(() => {
    init();
  });

  const onSortEnd = (oldIndex: number, newIndex: number) => {
    // console.log("setSelected", oldIndex, newIndex);
    setSelected((selected) => {
      if (selected) {
        const newSelected = {
          ...selected,
          selectFiles: arrayMoveImmutable(
            selected.selectFiles,
            oldIndex,
            newIndex
          ),
        };
        saveTable(newSelected);
        return newSelected;
      }
      return selected;
    });
  };

  const saveTable = useCallback(function saveTable(selected: Selected) {
    return selected.field.setValue(
      selected.select.recordId,
      selected.selectFiles.map((item: any) => item.val)
    );
  }, []);

  const renameFile = useCallback(
    async (index: number) => {
      const res = await alertInput({
        title: t("modal-title"),
        content: t("modal-content"),
        emptyText: t("modal-empty-text"),
        defaultValue: selected?.selectFiles[index].val.name,
      });
      console.log(res);
      if (res.ok && res.data) {
        const newSelectImages = ([] as any).concat(selected?.selectFiles);
        newSelectImages[index].val.name = res.data;
        console.log(newSelectImages === selected?.selectFiles);
        const newSelected: any = { ...selected, selectImages: newSelectImages };
        saveTable(newSelected);
        setSelected(newSelected);
      }
    },
    [alertInput, saveTable, selected, t]
  );

  const getUrlLink = useCallback(
    (file: any) => {
      return table.getAttachmentUrl(
        file.val.token,
        selected?.select.fieldId,
        selected?.select.recordId
      );
    },
    [selected?.select.fieldId, selected?.select.recordId]
  );

  const menu = [
    {
      node: "item",
      name: t("menu-open"),
      type: "tertiary",
      onClick() {
        if (params.current) {
          const index = (params.current as any).index;
          const file = selected?.selectFiles[index];
          if (!file) {
            return;
          }
          setTimeout(() => {
            openFile(file, index);
          }, 1);
        }
      },
    },
    { node: "divider" },
    {
      node: "item",
      name: t("menu-link"),
      type: "tertiary",
      onClick() {
        if (params.current) {
          const index = (params.current as any).index;
          setTimeout(async () => {
            const tid = Toast.info({
              icon: <Spin />,
              content: t("copying"),
              duration: 0,
            });
            const file = selected?.selectFiles[index];
            const url = await getUrlLink(file);
            if (!file) {
              return;
            }
            // 放置内容到剪切板
            copyText(url);
            Toast.success({ content: t("copy-success") });
            Notification.addNotice({
              type: "warning",
              title: t("copy-tip-title"),
              content: t("copy-tip-content"),
              position: "bottom",
            });
            Toast.close(tid);
          }, 1);
        }
      },
    },
    { node: "divider" },
    {
      node: "item",
      name: t("menu-rename"),
      type: "tertiary",
      onClick() {
        if (params.current) {
          renameFile((params.current as any).index);
        }
      },
    },
    {
      node: "item",
      name: t("menu-info"),
      type: "tertiary",
      onClick() {
        alert({
          title: t("menu-info"),
          content: (
            <Descriptions
              data={[
                {
                  key: t("menu-info-filename"),
                  value:
                    selected?.selectFiles[(params.current as any).index].val
                      .name,
                },
                {
                  key: t("menu-info-filetype"),
                  value:
                    selected?.selectFiles[(params.current as any).index].val
                      .type,
                },
                {
                  key: t("menu-info-filesize"),
                  value: smartFileSizeDisplay(
                    selected?.selectFiles[(params.current as any).index].val
                      .size
                  ),
                },
                {
                  key: t("menu-info-filetime"),
                  value: smartTimestampDisplay(
                    selected?.selectFiles[(params.current as any).index].val
                      .timeStamp
                  ),
                },
              ]}
            />
          ),
        });
      },
    },
    {
      node: "item",
      name: t("menu-download"),
      type: "tertiary",
      onClick() {
        if (params.current) {
          const index = (params.current as any).index;
          setTimeout(async () => {
            const file = selected?.selectFiles[index];
            if (!file) {
              return;
            }
            const url = await getUrlLink(file);
            downloadFile(await urlToFile(url, file.val.name, file.val.type));
          }, 1);
        }
      },
    },
    { node: "divider" },
    {
      node: "item",
      name: t("menu-delete"),
      type: "danger",
      async onClick() {
        if (params.current) {
          const index = (params.current as any).index;
          console.log(index, selected?.selectFiles[index]);
          const res = await alert({
            title: t("delete-title"),
            content: t("delete-content"),
            okType: "danger",
          });
          console.log(res);
          if (res.ok) {
            const newSelectImages = ([] as any).concat(selected?.selectFiles);
            newSelectImages.splice(index, 1);
            const newSelected: any = {
              ...selected,
              selectImages: newSelectImages,
            };
            saveTable(newSelected);
            setSelected(newSelected);
            Toast.success({ content: t("delete-success") });
          }
        }
      },
    },
  ];
  const customRequest = useCallback(
    async (o: any) => {
      console.log(o);
      const file = o.fileInstance;
      if (!file) {
        return;
      }
      const tid = Toast.info({
        showClose: false,
        duration: 0,
        icon: <Spin />,
        content: t("loading"),
      });
      try {
        const newSelectImage = {
          val: await fileToIOpenAttachment(base, file),
          url: await fileToURL(file),
        };
        if (!selected?.selectFiles) return;
        const newSelectImages = selected.selectFiles;
        newSelectImages.push(newSelectImage);
        const newSelected: any = {
          ...selected,
          selectImages: newSelectImages,
        };
        saveTable(newSelected);
        setSelected(newSelected);
        Toast.success({ content: t("upload-success") + file.name });
        o.onSuccess({ status: 201 });
      } catch (error) {
        Toast.error({ content: t("upload-fail") + String(error) });
        o.onError(error);
      }
      Toast.close(tid);
    },
    [saveTable, selected, t]
  );

  const openFile = useCallback(
    async (file: any, index: number) => {
      const tid = Toast.info({
        icon: <Spin />,
        content: t("opening"),
        duration: 0,
      });
      const url = await getUrlLink(file);
      const nextWin = window.open(`/viewer`, "_blank");
      if (nextWin) {
        (nextWin as any).option = () => ({ url, type: file.val.type });
      }
      setNextWin(nextWin || undefined);
      Toast.close(tid);
    },
    [getUrlLink]
  );

  const pasteImport = useCallback(async () => {
    // 获取剪切板内容
    const text = await alertInput({
      title: t("paste-import"),
      content: t("paste-import-content"),
    });
    console.log(text); // {ok:true, data: "http://xxxx.png"}
    if (text.ok && text.data) {
      if (!text.data.startsWith("http")) {
        Toast.error({ content: t("paste-import-fail") });
        return;
      }
      const tid = Toast.info({
        icon: <Spin />,
        content: t("loading"),
        duration: 0,
      });
      try {
        const file = await urlToFile(text.data, splitFilename(text.data));
        const newSelectImage = {
          val: await fileToIOpenAttachment(base, file),
          url: await fileToURL(file),
        };
        if (!selected?.selectFiles) return;
        const newSelectImages = selected.selectFiles;
        newSelectImages.push(newSelectImage);
        const newSelected: any = {
          ...selected,
          selectImages: newSelectImages,
        };
        saveTable(newSelected);
        setSelected(newSelected);
        Toast.success({ content: t("upload-success") + file.name });
      } catch (error) {
        Toast.error({ content: t("upload-fail") + String(error) });
      }
      Toast.close(tid);
    }
  }, []);

  return (
    <div>
      {loading ? (
        <Spin
          size="large"
          style={{ margin: "50vh 50vw", transform: "translate(-50%, -50%)" }}
        />
      ) : !selected || !isAttachment ? (
        <Empty
          image={<IllustrationNoContent style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoContentDark style={{ width: 150, height: 150 }} />
          }
          description={t("empty")}
          style={{ marginTop: "20vh" }}
        />
      ) : current === -1 ? (
        <>
          <div className={styles["block-menu"]}>
            <div>
              <Button
                size="small"
                icon={<IconFilledArrowUp size="small" />}
                onClick={() => (uploadRef.current as any)?.openFileDialog()}
              >
                {t("upload-btn")}
              </Button>
            </div>
            <div className={styles["menu-item-btn"]}>
              <Button
                size="small"
                icon={<IconBolt size="small" />}
                onClick={() => pasteImport()}
              >
                {t("import-btn")}
              </Button>
            </div>
            {/* <div
              className={styles["menu-item"]}
              onClick={() => setConfMerge({ fullMode: !conf.fullMode })}
            >
              <Text>{t("full-mode")}</Text>
              <Switch
                size="small"
                checked={conf.fullMode}
                aria-label="open full model"
              ></Switch>
            </div> */}
            <div
              className={styles["menu-item"]}
              onClick={() => (
                setConfMerge({ previewMode: !conf.previewMode }),
                Toast.info({ content: t("preview-tip") })
              )}
            >
              <Text>{t("preview-mode")}</Text>
              <Switch
                size="small"
                checked={conf.previewMode}
                aria-label="open full model"
              ></Switch>
            </div>
          </div>
          <Upload
            style={{
              margin: "5px",
              height: selected?.selectFiles.length > 0 ? "auto" : "70vh",
            }}
            action="/upload"
            ref={uploadRef as any}
            draggable={true}
            dragMainText={t("upload-drag-text")}
            dragSubText={t("upload-drag-sub")}
            // uploadTrigger="custom"
            addOnPasting
            multiple
            showUploadList={false}
            customRequest={customRequest}
          >
            {selected?.selectFiles.length > 0 ? (
              <div
                style={{ width: "100%" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <SortableList
                  onSortEnd={onSortEnd}
                  draggedItemClassName="dragged"
                  className={styles["block-image"]}
                >
                  {selected?.selectFiles?.map((file, index) => {
                    return (
                      <SortableItem key={file.val.token}>
                        {
                          <div
                            className={styles["image-item"]}
                            onClick={() => openFile(file, index)}
                            onContextMenu={(e) => {
                              popup(e as unknown as MouseEvent, menu, {
                                index,
                              });
                            }}
                          >
                            <img
                              className={styles["image"]}
                              src={
                                file.val.type.startsWith("image") &&
                                storeConf.previewMode
                                  ? file.url
                                  : getFileTypeIconAsUrl({
                                      extension:
                                        fileExt(file.val.name)[1] || "file",
                                    })
                              }
                              alt={file.val.name}
                              style={{ width: "100%", height: "100%" }}
                            />

                            <Text
                              ellipsis={true}
                              className={styles["title"]}
                              size="small"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClickCapture={() => renameFile(index)}
                            >
                              {file.val.name}
                            </Text>
                          </div>
                        }
                      </SortableItem>
                    );
                  })}
                </SortableList>
              </div>
            ) : undefined}
          </Upload>
          <div className={styles["image-tip"]}>{t("image-tip")}</div>
        </>
      ) : conf ? (
        <div>
          <Empty
            image={
              <IllustrationConstruction style={{ width: 150, height: 150 }} />
            }
            darkModeImage={
              <IllustrationConstructionDark
                style={{ width: 150, height: 150 }}
              />
            }
            description={t("editing")}
            style={{ marginTop: "20vh" }}
          >
            <div>
              <Button
                style={{ padding: "6px 24px", marginRight: 12 }}
                type="primary"
                onClick={nextWin?.close?.bind(nextWin)}
              >
                {t("back-list")}
              </Button>
              <Button
                style={{ padding: "6px 24px" }}
                theme="solid"
                type="primary"
                onClick={nextWin?.focus?.bind(nextWin)}
              >
                {t("back-edit")}
              </Button>
            </div>
          </Empty>
        </div>
      ) : (
        <div style={{ height: "100vh" }}>{/* 打开编辑窗口 */}</div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "5px",
          color: "#666",
        }}
      ></div>
    </div>
  );
}
