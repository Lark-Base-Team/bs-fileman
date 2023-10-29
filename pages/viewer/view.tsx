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
import { getProgrammingLanguage } from "../../utils/shared";

// let options = {
//   url: "",
//   type: "",
// };
// if (typeof window !== "undefined") {
//   options = (window as any).option();
//   window.onload = () => {
//     (window as any).isLoaded = true;
//   };
// }

// let url = options.url;
// let type = options.type;

// console.log(options);
let load = false;
export default function Edit() {
  const [t, i18n] = useTranslation();
  const router = useRouter();
  const [child, setChild] = useState<any>(<></>);
  let { url = "", type = "", ext = "" } = router.query as any;
  if (!type) type = "text";

  useEffect(() => {
    (async () => {
      if (load) return;
      load = true;
      const [sub = "", sup = ""] = type.split("/");
      console.log(sub, sup);

      const defaultChild = () => {
        typeof open !== "undefined" && open(url);
        return <h1 style={{ color: "#fff" }}>{t("viewer-no-support")}</h1>;
      };

      const childMap = {
        image: () => <ImagePreview src={url} visible={true} onClose={close} />,
        video: () => {
          const ReactPlayer = dynamic(() => import("react-player"), {
            ssr: false,
          });
          return (
            <ReactPlayer
              url={url}
              controls
              pip
              width={"100%"}
              height={"100%"}
            ></ReactPlayer>
          );
        },
        audio: () => {
          const ReactPlayer = dynamic(() => import("react-player"), {
            ssr: false,
          });
          return <ReactPlayer url={url} controls></ReactPlayer>;
        },

        application: () => {
          if (type.includes("office")) {
            const DocViewer = dynamic(
              () => import("@cyntler/react-doc-viewer"),
              {
                ssr: false,
              }
            );
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
          } else if (type.includes("pdf")) {
            const PDF = dynamic(() => import("../../components/PDF"), {
              ssr: false,
            });
            return (
              <div style={{ height: "100%", width: "60%" }}>
                <PDF url={url}></PDF>
              </div>
            );
          } else if (type.includes("json")) {
            return childMap.text();
          }
          return <h1 style={{ color: "#fff" }}>{t("viewer-no-support")}</h1>;
        },
        text: async () => {
          const Editor = dynamic(() => import("@monaco-editor/react"), {
            ssr: false,
          });
          const code = await fetch(url).then((res) => res.text());

          const lang = getProgrammingLanguage(ext) as string;

          console.log(ext, lang);
          return (
            <Editor
              height="100vh"
              width="100vw"
              defaultValue={code}
              defaultLanguage={lang.toLowerCase()}
            />
          );
        },
      };

      const child =
        (await (childMap[sub as keyof typeof childMap] ?? defaultChild)()) ??
        defaultChild();
      console.log(child);

      setChild(child);
    })();
  });

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
            overflow: "auto",
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
