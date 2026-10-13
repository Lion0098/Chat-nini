import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { answerCall, pollCalls } from "@/server/api";
import { defaultIceServers } from "@/lib/multiplayer";
import { usePrefs } from "@/lib/prefs";
import type { LiveCall } from "@/lib/chat-types";

function asDesc(payload: unknown): RTCSessionDescriptionInit {
  if (typeof payload === "string") return JSON.parse(payload) as RTCSessionDescriptionInit;
  return payload as RTCSessionDescriptionInit;
}

function asIce(payload: unknown): RTCIceCandidateInit {
  if (typeof payload === "string") return JSON.parse(payload) as RTCIceCandidateInit;
  return payload as RTCIceCandidateInit;
}

function MediaCall({
  call,
  video,
}: {
  call: LiveCall;
  video: boolean;
}) {
  const { t } = usePrefs();
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<"connecting" | "live" | "failed">("connecting");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(!video);
  const role = call.callerId === call.peerId ? "callee" : "caller";

  useEffect(() => {
    const room = call.id;
    const self = role === "caller" ? "caller" : "callee";
    const other = role === "caller" ? "callee" : "caller";
    let stopped = false;
    let pc: RTCPeerConnection | null = null;
    let since = 0;
    let timer = 0;
    let offered = false;
    const pending: RTCIceCandidateInit[] = [];
    const streamHeld: MediaStream[] = [];

    async function post(kind: string, payload: unknown) {
      await fetch("/api/rtc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "signal", room, from: self, to: other, kind, payload }),
      });
    }

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
        streamHeld.push(stream);
        streamRef.current = stream;
        if (stopped) return;
        if (localRef.current) {
          localRef.current.srcObject = stream;
          void localRef.current.play().catch(() => undefined);
        }
        pc = new RTCPeerConnection({ iceServers: defaultIceServers() });
        for (const track of stream.getTracks()) pc.addTrack(track, stream);
        pc.ontrack = (ev) => {
          const remote = ev.streams[0];
          if (remoteRef.current && remote) {
            remoteRef.current.srcObject = remote;
            void remoteRef.current.play().catch(() => undefined);
          }
        };
        pc.onicecandidate = (ev) => {
          if (ev.candidate) void post("ice", ev.candidate.toJSON());
        };
        pc.onconnectionstatechange = () => {
          if (pc?.connectionState === "connected") setPhase("live");
          if (pc?.connectionState === "failed") setPhase("failed");
        };

        const poll = async () => {
          if (stopped || !pc) return;
          try {
            const res = await fetch(
              `/api/rtc?room=${encodeURIComponent(room)}&peer=${self}&name=${role}&since=${since}`,
            );
            const data = (await res.json()) as {
              peers?: { id: string }[];
              signals?: { id: number; kind: string; payload: unknown }[];
            };
            for (const sig of data.signals ?? []) {
              since = Math.max(since, sig.id);
              if (sig.kind === "offer" && role === "callee") {
                await pc.setRemoteDescription(asDesc(sig.payload));
                for (const c of pending) await pc.addIceCandidate(c);
                pending.length = 0;
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await post("answer", answer);
              } else if (sig.kind === "answer" && role === "caller") {
                if (pc.signalingState !== "have-local-offer") continue;
                await pc.setRemoteDescription(asDesc(sig.payload));
                for (const c of pending) await pc.addIceCandidate(c);
                pending.length = 0;
              } else if (sig.kind === "ice") {
                const ice = asIce(sig.payload);
                if (pc.remoteDescription) await pc.addIceCandidate(ice);
                else pending.push(ice);
              }
            }
            if (role === "caller" && !offered && (data.peers ?? []).some((p) => p.id === "callee")) {
              offered = true;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await post("offer", offer);
            }
          } catch {
            /* next poll retries */
          }
          timer = window.setTimeout(() => void poll(), 700);
        };
        void poll();
      } catch {
        if (!stopped) setPhase("failed");
      }
    })();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      pc?.close();
      for (const stream of streamHeld) stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      void fetch("/api/rtc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "leave", room, peer: self }),
      });
    };
  }, [call.id, role, video]);

  function toggleMute() {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  }

  function toggleCam() {
    const next = !camOff;
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
    setCamOff(next);
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-ink text-panel">
      <video ref={remoteRef} autoPlay playsInline className="min-h-0 flex-1 bg-ink object-cover" />
      <video
        ref={localRef}
        autoPlay
        muted
        playsInline
        className="absolute end-4 top-4 h-28 w-20 rounded-lg bg-header object-cover shadow-lg"
      />
      <div className="absolute inset-x-0 top-4 text-center text-sm text-panel">
        <div className="font-semibold">{call.peerName}</div>
        <div className="text-panel/80">{phase === "live" ? t("live") : phase === "failed" ? t("callFailed") : t("connecting")}</div>
      </div>
      <div className="flex items-center justify-center gap-3 bg-ink/80 p-4">
        <button type="button" aria-label={muted ? t("unmuteMic") : t("mute")} onClick={toggleMute} className="grid size-12 place-items-center rounded-full bg-header text-ink">
          {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>
        {video ? (
          <button type="button" aria-label={camOff ? t("camOn") : t("camOff")} onClick={toggleCam} className="grid size-12 place-items-center rounded-full bg-header text-ink">
            {camOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
          </button>
        ) : null}
        <Hangup id={call.id} />
      </div>
    </div>
  );
}

function Hangup({ id, action = "end" }: { id: string; action?: "end" | "cancel" | "decline" }) {
  const { t } = usePrefs();
  const qc = useQueryClient();
  return (
    <button
      type="button"
      aria-label={action === "decline" ? t("decline") : t("end")}
      className="grid size-12 place-items-center rounded-full bg-danger text-panel"
      onClick={() => {
        void answerCall({ data: { id, action } }).finally(() => {
          void qc.invalidateQueries({ queryKey: ["calls"] });
          void qc.invalidateQueries({ queryKey: ["messages"] });
        });
      }}
    >
      <PhoneOff className="size-5" />
    </button>
  );
}

export function CallLayer({ meId }: { meId: string }) {
  const { t } = usePrefs();
  const qc = useQueryClient();
  const calls = useQuery({
    queryKey: ["calls"],
    queryFn: () => pollCalls(),
    refetchInterval: 2000,
  });
  const incoming = calls.data?.incoming ?? null;
  const active = calls.data?.active ?? null;
  const outgoing = active && active.status === "ringing" && active.callerId === meId ? active : null;
  const live = active && active.status === "accepted" ? active : null;

  return (
    <>
      {live ? <MediaCall call={live} video={live.kind === "video"} /> : null}
      {outgoing ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-ink text-panel">
          <Phone className="size-10" />
          <div className="text-lg font-semibold">{outgoing.peerName}</div>
          <div className="text-sm text-panel/80">{t("calling")}</div>
          <Hangup id={outgoing.id} action="cancel" />
        </div>
      ) : null}
      {incoming ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-panel p-5 text-center text-ink shadow-xl">
            <div className="text-sm text-muted">{t("incoming")}</div>
            <div className="mt-1 text-xl font-semibold">{incoming.peerName}</div>
            <div className="mt-1 text-sm text-muted">{incoming.kind === "video" ? t("videoCall") : t("call")}</div>
            <div className="mt-5 flex items-center justify-center gap-6">
              <Hangup id={incoming.id} action="decline" />
              <button
                type="button"
                aria-label={t("accept")}
                className="grid size-12 place-items-center rounded-full bg-unread text-on"
                onClick={() => {
                  void answerCall({ data: { id: incoming.id, action: "accept" } }).then(() => {
                    void qc.invalidateQueries({ queryKey: ["calls"] });
                  });
                }}
              >
                <Phone className="size-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
