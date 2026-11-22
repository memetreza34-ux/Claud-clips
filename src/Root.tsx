import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { PigeonShort, PIGEON_FRAMES } from "./videos/pigeon/Pigeon";
import { BatsShort, BATS_FRAMES } from "./videos/bats/Bats";
import { Bats3DShort, BATS3D_FRAMES } from "./videos/bats3d/Bats3D";
import { CastSheet } from "./videos/bats3d/CastSheet";
import { BatsPShort, BATSP_FRAMES } from "./videos/batsp/BatsP";
import { WhaleShort, WHALE_FRAMES } from "./videos/whale/Whale";
import { WhaleCodeShort, WHALECODE_FRAMES } from "./videos/whalecode/WhaleCode";
import { WhaleFullShort, WHALEFULL_FRAMES } from "./videos/whalefull/WhaleFull";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BatsShort" component={BatsShort} durationInFrames={BATS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Bats3DShort" component={Bats3DShort} durationInFrames={BATS3D_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BatsPShort" component={BatsPShort} durationInFrames={BATSP_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BatsCast" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1080} />
    <Composition id="WhaleShort" component={WhaleShort} durationInFrames={WHALE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="WhaleCodeShort" component={WhaleCodeShort} durationInFrames={WHALECODE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="WhaleFullShort" component={WhaleFullShort} durationInFrames={WHALEFULL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="PigeonShort" component={PigeonShort} durationInFrames={PIGEON_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
