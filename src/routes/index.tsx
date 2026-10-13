import { createFileRoute } from "@tanstack/react-router";
import { Messenger } from "@/components/messenger";

export const Route = createFileRoute("/")({ component: Messenger });
