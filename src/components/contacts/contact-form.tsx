"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const contactFormSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  lineUserId: z.string().max(50).optional().or(z.literal("")),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    lineUserId: string | null;
  };
  onSuccess?: () => void;
}

export function ContactForm({ open, onOpenChange, contact, onSuccess }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!contact;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: contact?.name || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      lineUserId: contact?.lineUserId || "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      // Clean up empty strings to null
      const cleanedData = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        lineUserId: data.lineUserId || null,
      };

      if (isEditing) {
        // TODO: Call updateContact server action
        const { updateContact } = await import("@/actions/contacts");
        await updateContact(contact.id, cleanedData);
        toast.success("コンタクトを更新しました");
      } else {
        // TODO: Call createContact server action
        const { createContact } = await import("@/actions/contacts");
        await createContact(cleanedData);
        toast.success("コンタクトを作成しました");
      }

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "コンタクト編集" : "新規コンタクト"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "コンタクト情報を編集します"
              : "新しいコンタクトを追加します"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名前 *</FormLabel>
                  <FormControl>
                    <Input placeholder="田中 太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電話番号</FormLabel>
                  <FormControl>
                    <Input placeholder="090-1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lineUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LINE User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="U1234567890..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "更新" : "作成"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
