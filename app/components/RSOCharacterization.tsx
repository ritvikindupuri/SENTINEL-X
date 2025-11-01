
"use client"

import { RSO } from "@/lib/real-time-inference";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";

interface RSOCharacterizationProps {
  rso: RSO | null;
}

const modelExplanations = {
  autoencoder: "The Autoencoder model detects anomalies by reconstructing telemetry data. A high score means the reconstructed data is very similar to the original, indicating normal behavior. Low scores suggest the satellite's current telemetry is unusual and cannot be reconstructed well.",
  isolationForest: "The Isolation Forest model isolates anomalies by randomly partitioning the data. A high score indicates the data point is 'hard to isolate,' meaning it's a normal inlier. Low scores mean the data point is easily isolated and likely an anomaly.",
  svm: "The One-Class SVM model learns a boundary around normal data points. A high score means the current telemetry falls within this normal boundary. A low score suggests the data point is outside the boundary and is considered an anomaly.",
  threatScore: "The Threat Score is a composite metric derived from the individual scores of the Autoencoder, Isolation Forest, and One-Class SVM models. It provides a holistic assessment of potential threats, with a lower score indicating a higher probability of an anomaly."
};


export default function RSOCharacterization({ rso }: RSOCharacterizationProps) {
  if (!rso) {
    return (
      <Card className="h-full bg-[#2a2d3e] border-gray-700 flex items-center justify-center">
        <CardContent>
          <p className="text-gray-400">No satellite selected. Click a satellite on the map to see its details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-[#2a2d3e] border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>RSO Characterization: {rso.name}</span>
          <Badge variant={
            rso.threatLevel === "high" ? "destructive" :
            rso.threatLevel === "medium" ? "secondary" :
            "default"
          }>
            {rso.threatLevel.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="space-y-4 pt-4">
              <ScoreDisplay score={rso.threatScore} label="Threat Score" model="threatScore" />
              <div className="grid grid-cols-3 gap-4">
                <ScoreDisplay score={rso.autoencoder} label="Autoencoder" model="autoencoder" />
                <ScoreDisplay score={rso.isolationForest} label="Isolation Forest" model="isolationForest" />
                <ScoreDisplay score={rso.svm} label="One-Class SVM" model="svm" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="details">
             <div className="pt-4 text-sm text-gray-300">
                <p><strong>NORAD ID:</strong> {rso.id}</p>
                <p><strong>Status:</strong> <span className="text-green-400">{rso.status}</span></p>
             </div>
          </TabsContent>
          <TabsContent value="mitigation">
            <div className="pt-4">
              <h3 className="font-bold mb-2">Defensive Capabilities</h3>
              <ul className="space-y-2">
                <MitigationItem title="Onboard Maneuverability" capability="High" />
                <MitigationItem title="Communications Jamming" capability="Moderate" />
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ScoreDisplay({ score, label, model }: { score: number, label: string, model: keyof typeof modelExplanations }) {
  const scoreColor = score > 80 ? "text-green-400" : score > 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="text-center">
      <div className="flex items-center justify-center space-x-2">
        <h4 className="text-lg font-semibold">{label}</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-gray-800 text-white border-gray-700">
              <p>{modelExplanations[model]}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className={`text-4xl font-bold ${scoreColor}`}>{score.toFixed(0)}</p>
    </div>
  );
}

function MitigationItem({ title, capability }: { title: string, capability: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <li className="flex justify-between items-center p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer">
          <span>{title}</span>
          <Badge>{capability}</Badge>
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#2a2d3e] border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Detailed information about the {title.toLowerCase()} capability.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>This is a placeholder for detailed information regarding this mitigation technique, including its effectiveness, cost, and potential side effects.</p>
          <p className="mt-4 font-bold">MITRE/SPARTA Mapping: T001</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
