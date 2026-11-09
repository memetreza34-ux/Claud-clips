import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { PigeonShort, PIGEON_FRAMES } from "./videos/pigeon/Pigeon";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="PigeonShort" component={PigeonShort} durationInFrames={PIGEON_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
