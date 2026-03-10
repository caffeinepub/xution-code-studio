import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAIPreferenceRules,
  useAddAIPreference,
  useRemoveAIPreference,
} from "@/hooks/useQueries";
import {
  Brain,
  Loader2,
  Plus,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function TrainingPage() {
  const { data: rules = [], isLoading } = useAIPreferenceRules();
  const addRule = useAddAIPreference();
  const removeRule = useRemoveAIPreference();

  // Natural Language
  const [newRule, setNewRule] = useState("");

  // Reinforcement
  const [reinforceExample, setReinforceExample] = useState("");
  const [reinforceReward, setReinforceReward] = useState("");
  const [reinforceScore, setReinforceScore] = useState<1 | -1>(1);

  // Semi-Supervised
  const [semiLabeled, setSemiLabeled] = useState("");
  const [semiLabel, setSemiLabel] = useState("");
  const [semiUnlabeled, setSemiUnlabeled] = useState("");

  // Unsupervised
  const [unsupervisedPattern, setUnsupervisedPattern] = useState("");
  const [unsupervisedCluster, setUnsupervisedCluster] = useState("");

  const handleAddNatural = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    try {
      await addRule.mutateAsync(newRule.trim());
      toast.success("AI preference added!");
      setNewRule("");
    } catch {
      toast.error("Failed to add preference");
    }
  };

  const handleAddReinforce = async () => {
    if (!reinforceExample.trim()) return;
    const sign = reinforceScore === 1 ? "+1" : "-1";
    const rule = `[REINFORCE:${sign}] ${reinforceReward ? `${reinforceReward}: ` : ""}${reinforceExample.trim()}`;
    try {
      await addRule.mutateAsync(rule);
      toast.success("Reinforcement example added!");
      setReinforceExample("");
      setReinforceReward("");
      setReinforceScore(1);
    } catch {
      toast.error("Failed to add reinforcement");
    }
  };

  const handleAddSemi = async () => {
    if (!semiLabeled.trim() || !semiUnlabeled.trim()) return;
    const rule = `[SEMI:${semiLabel || "general"}] ${semiLabeled.trim()} | ${semiUnlabeled.trim()}`;
    try {
      await addRule.mutateAsync(rule);
      toast.success("Semi-supervised pair added!");
      setSemiLabeled("");
      setSemiLabel("");
      setSemiUnlabeled("");
    } catch {
      toast.error("Failed to add semi-supervised pair");
    }
  };

  const handleAddUnsupervised = async () => {
    if (!unsupervisedPattern.trim()) return;
    const rule = `[UNSUPERVISED:${unsupervisedCluster || "general"}] ${unsupervisedPattern.trim()}`;
    try {
      await addRule.mutateAsync(rule);
      toast.success("Pattern added!");
      setUnsupervisedPattern("");
      setUnsupervisedCluster("");
    } catch {
      toast.error("Failed to add pattern");
    }
  };

  const handleRemove = async (index: number) => {
    try {
      await removeRule.mutateAsync(BigInt(index));
      toast.success("Preference removed");
    } catch {
      toast.error("Failed to remove preference");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Brain className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">AI Training</h1>
          <Badge className="bg-primary/20 text-primary border-primary/40">
            Class 6
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Train the AI using multiple learning methods: natural language,
          reinforcement, semi-supervised, and unsupervised.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Add Training Data</h2>
        </div>
        <Tabs defaultValue="natural">
          <TabsList className="w-full grid grid-cols-4 mb-5 bg-muted/30">
            <TabsTrigger
              value="natural"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              data-ocid="training.natural_tab"
            >
              Natural Language
            </TabsTrigger>
            <TabsTrigger
              value="reinforce"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              data-ocid="training.reinforce_tab"
            >
              Reinforcement
            </TabsTrigger>
            <TabsTrigger
              value="semi"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              data-ocid="training.semi_tab"
            >
              Semi-Supervised
            </TabsTrigger>
            <TabsTrigger
              value="unsupervised"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              data-ocid="training.unsupervised_tab"
            >
              Unsupervised
            </TabsTrigger>
          </TabsList>

          {/* Natural Language */}
          <TabsContent value="natural">
            <p className="text-xs text-muted-foreground mb-3">
              Describe rules in plain language. The AI will follow these during
              code generation.
            </p>
            <form onSubmit={handleAddNatural} className="flex gap-2">
              <Input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="e.g. Always use TypeScript, prefer functional components..."
                className="flex-1"
                data-ocid="training.input"
              />
              <Button
                type="submit"
                disabled={!newRule.trim() || addRule.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-ocid="training.add_button"
              >
                {addRule.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Reinforcement */}
          <TabsContent value="reinforce">
            <p className="text-xs text-muted-foreground mb-3">
              Provide code examples with positive or negative feedback to shape
              AI behavior.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Reward Description (optional)</Label>
                <Input
                  value={reinforceReward}
                  onChange={(e) => setReinforceReward(e.target.value)}
                  placeholder="e.g. Good: clean separation of concerns"
                  data-ocid="training.reinforce_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Code Example</Label>
                <Textarea
                  value={reinforceExample}
                  onChange={(e) => setReinforceExample(e.target.value)}
                  placeholder="Paste a code example here..."
                  className="min-h-[80px] text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Feedback:</span>
                <button
                  type="button"
                  onClick={() => setReinforceScore(1)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    reinforceScore === 1
                      ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid="training.reinforce_thumbsup"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Positive
                </button>
                <button
                  type="button"
                  onClick={() => setReinforceScore(-1)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    reinforceScore === -1
                      ? "bg-red-500/20 border-red-500/50 text-red-400"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid="training.reinforce_thumbsdown"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  Negative
                </button>
              </div>
              <Button
                type="button"
                onClick={handleAddReinforce}
                disabled={!reinforceExample.trim() || addRule.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {addRule.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" /> Add Reinforcement Example
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Semi-Supervised */}
          <TabsContent value="semi">
            <p className="text-xs text-muted-foreground mb-3">
              Pair labeled examples with related unlabeled ones to improve
              generalization.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Label / Category</Label>
                <Input
                  value={semiLabel}
                  onChange={(e) => setSemiLabel(e.target.value)}
                  placeholder="e.g. react-component, api-handler"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Labeled Example</Label>
                  <Textarea
                    value={semiLabeled}
                    onChange={(e) => setSemiLabeled(e.target.value)}
                    placeholder="Annotated / known example..."
                    className="min-h-[80px] text-xs font-mono"
                    data-ocid="training.semi_labeled_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unlabeled Example</Label>
                  <Textarea
                    value={semiUnlabeled}
                    onChange={(e) => setSemiUnlabeled(e.target.value)}
                    placeholder="Raw / unannotated example..."
                    className="min-h-[80px] text-xs font-mono"
                    data-ocid="training.semi_unlabeled_input"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddSemi}
                disabled={
                  !semiLabeled.trim() ||
                  !semiUnlabeled.trim() ||
                  addRule.isPending
                }
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {addRule.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" /> Add Pair
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Unsupervised */}
          <TabsContent value="unsupervised">
            <p className="text-xs text-muted-foreground mb-3">
              Add raw patterns and examples for the AI to discover structure on
              its own.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cluster Name (optional)</Label>
                <Input
                  value={unsupervisedCluster}
                  onChange={(e) => setUnsupervisedCluster(e.target.value)}
                  placeholder="e.g. ui-patterns, data-structures"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Raw Patterns / Examples</Label>
                <Textarea
                  value={unsupervisedPattern}
                  onChange={(e) => setUnsupervisedPattern(e.target.value)}
                  placeholder="Paste raw code patterns, examples, or text..."
                  className="min-h-[100px] text-xs font-mono"
                  data-ocid="training.unsupervised_input"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddUnsupervised}
                disabled={!unsupervisedPattern.trim() || addRule.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {addRule.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" /> Add Pattern
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Active Rules */}
      <div className="bg-card border border-border rounded-xl">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <span className="text-sm font-semibold">Active Preferences</span>
          <Badge variant="outline" className="text-xs">
            {rules.length} rule{rules.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        {isLoading ? (
          <div
            className="flex items-center justify-center p-8"
            data-ocid="training.loading_state"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center p-10 text-center"
            data-ocid="training.empty_state"
          >
            <Brain className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No AI preferences set yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add rules above to guide AI code generation
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="p-2 space-y-1" data-ocid="training.list">
              <AnimatePresence>
                {rules.map((rule, i) => (
                  <motion.div
                    key={rule}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="group flex items-center gap-3 bg-muted/20 hover:bg-muted/40 rounded-lg px-3 py-2.5 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-primary font-bold">
                        {i + 1}
                      </span>
                    </div>
                    <p className="flex-1 text-sm text-foreground">{rule}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(i)}
                      disabled={removeRule.isPending}
                      className="w-7 h-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-ocid={`training.delete_button.${i + 1}`}
                    >
                      {removeRule.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
