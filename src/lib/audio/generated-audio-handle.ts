type GeneratedAudioNode = {
  stop?: () => void;
  disconnect?: () => void;
};

export function stopAudioNodes(nodes: GeneratedAudioNode[]) {
  for (const node of nodes) {
    try {
      node.stop?.();
    } catch { }

    try {
      node.disconnect?.();
    } catch { }
  }
}
