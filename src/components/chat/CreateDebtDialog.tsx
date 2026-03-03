import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface CreateDebtDialogProps {
  user: any;
  displayName: string;
  friendUserId: string;
  friendName: string;
}

const CreateDebtDialog = ({ user, displayName, friendUserId, friendName }: CreateDebtDialogProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!description.trim() || !amount || !date || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("despesas").insert({
      user_id: friendUserId,
      description: description.trim(),
      amount: parseFloat(amount),
      date: format(date, "yyyy-MM-dd"),
      category: "Dívida",
      type: "divida",
      details: `Dívida com ${displayName}`,
      paid: false,
      created_by: user.id,
      creditor_name: displayName,
    } as any);

    if (error) {
      toast.error("Erro ao criar dívida");
    } else {
      toast.success(`Dívida criada para ${friendName}! 💸`);
      setDescription("");
      setAmount("");
      setDate(undefined);
      setOpen(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <DollarSign className="w-3.5 h-3.5" />
          Criar Dívida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Criar dívida para {friendName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm">Descrição</Label>
            <Input
              placeholder="Ex: Almoço, Empréstimo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Data de vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <p className="text-xs text-muted-foreground">
            {friendName} receberá uma notificação e verá esta dívida em suas despesas.
          </p>

          <Button
            onClick={handleCreate}
            disabled={submitting || !description.trim() || !amount || !date}
            className="w-full gap-1.5"
          >
            <DollarSign className="w-4 h-4" />
            {submitting ? "Criando..." : "Criar Dívida"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDebtDialog;
