"use client";
import {
  Col,
  Image,
  Row,
  Spin,
  Empty,
  Badge,
  Toast,
  Button,
  ImagePreview,
} from "@douyinfe/semi-ui";
import {
  IllustrationNotFound,
  IllustrationNotFoundDark,
} from "@douyinfe/semi-illustrations";
import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { IconBackward, IconUndo } from "@douyinfe/semi-icons";
import ReactPlayer from "react-player";
import DocViewer from "@cyntler/react-doc-viewer";

let options = {
  url: "",
  type: "",
};
if (typeof window !== "undefined") {
  options = (window as any).option();
  window.onload = () => {
    (window as any).isLoaded = true;
  };
}

const url = options.url;
const type = options.type;
const [sub, sup] = type.split("/");

console.log(options);

export default function Edit() {
  const [t, i18n] = useTranslation();
  const defaultChild = () => {
    typeof open !== "undefined" && open(url);
    return <h1 style={{ color: "#fff" }}>{t("viewer-no-support")}</h1>;
  };
  const child =
    (
      {
        image: () => <ImagePreview src={url} visible={true} onClose={close} />,
        video: () => (
          <ReactPlayer
            url={url}
            controls
            pip
            width={"100%"}
            height={"100%"}
          ></ReactPlayer>
        ),
        audio: () => <ReactPlayer url={url} controls></ReactPlayer>,
        application: () => {
          if (type.includes("office")) {
            return (
              <DocViewer
                documents={[
                  {
                    uri: url,
                  },
                ]}
                config={{
                  header: {
                    disableHeader: true,
                    disableFileName: false,
                    retainURLParams: false,
                  },
                }}
              />
            );
          }
          return <h1 style={{ color: "#fff" }}>{t("viewer-no-support")}</h1>;
        },
      }[sub] ?? defaultChild
    )() ?? defaultChild();

  return (
    <>
      {url ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#000",
          }}
        >
          {/* <Button
            style={{
              position: "fixed",
              left: "10px",
              top: "10px",
              zIndex: 1000,
            }}
            icon={<IconUndo />}
            theme="light"
            type="secondary"
            aria-label="back"
            onClick={close}
          /> */}
          {child}
        </div>
      ) : (
        <Empty
          image={<IllustrationNotFound style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNotFoundDark style={{ width: 150, height: 150 }} />
          }
          description={"404"}
          style={{ marginTop: "20vh" }}
        />
      )}
    </>
  );
}
