"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ServiceForm, CurrencyForm } from "./ItemForms";
import AccountDialog from "./AccountDialog";
import DebtDialog from "./DebtDialog";
import { useState } from "react";
import { updateItemToDb, deleteItemFromDb, archiveItem, unarchiveItem } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { MoreVertical, X, Trash2, Archive } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast, toastMessages } from "@/lib/toast";

export default function ItemDialog({ open, onOpenChange, item, onItemUpdated, onItemDeleted, onItemArchived, onItemUnarchived }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
    onItemUpdated: (item: any) => void;
    onItemDeleted: (id: string) => void;
    onItemArchived?: (item: any) => void;
    onItemUnarchived?: (item: any) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [unarchiving, setUnarchiving] = useState(false);

    // For account items, use AccountDialog
    if (item?.type === 'account') {
        return <AccountDialog
            open={open}
            onOpenChange={onOpenChange}
            item={item}
            onItemUpdated={onItemUpdated}
            onItemDeleted={onItemDeleted}
            onItemArchived={onItemArchived}
            onItemUnarchived={onItemUnarchived}
        />;
    }

    // For debt items, use DebtDialog
    if (item?.type === 'debt') {
        return <DebtDialog
            open={open}
            onOpenChange={onOpenChange}
            item={item}
            onItemUpdated={onItemUpdated}
            onItemDeleted={onItemDeleted}
            onItemArchived={onItemArchived}
            onItemUnarchived={onItemUnarchived}
        />;
    }

    async function handleSave(data: any) {
        setLoading(true);
        const toastId = showToast.loading(toastMessages.saving);
        try {
            const updated = await updateItemToDb({ ...item, ...data });
            onItemUpdated(updated);
            showToast.update(toastId, toastMessages.saved, 'success');
        } catch (error) {
            showToast.update(toastId, toastMessages.saveError, 'error');
        } finally {
            setLoading(false);
            onOpenChange(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        const toastId = showToast.loading(toastMessages.deleting);
        try {
            await deleteItemFromDb(item._id);
            onItemDeleted(item._id);
            showToast.update(toastId, toastMessages.deleted, 'success');
        } catch (error) {
            showToast.update(toastId, toastMessages.deleteError, 'error');
        } finally {
            setDeleting(false);
            onOpenChange(false);
        }
    }

    async function handleArchive() {
        if (!onItemArchived) return;

        setArchiving(true);
        const toastId = showToast.loading('Archiving item...');
        try {
            const archived = await archiveItem(item._id);
            onItemArchived(archived);
            showToast.update(toastId, 'Item archived successfully!', 'success');
        } catch (error) {
            showToast.update(toastId, 'Failed to archive item', 'error');
        } finally {
            setArchiving(false);
            onOpenChange(false);
        }
    }

    async function handleUnarchive() {
        if (!onItemUnarchived) return;

        setUnarchiving(true);
        const toastId = showToast.loading('Unarchiving item...');
        try {
            const unarchived = await unarchiveItem(item._id);
            onItemUnarchived(unarchived);
            showToast.update(toastId, 'Item unarchived successfully!', 'success');
        } catch (error) {
            showToast.update(toastId, 'Failed to unarchive item', 'error');
        } finally {
            setUnarchiving(false);
            onOpenChange(false);
        }
    }

    function handleCancel() {
        onOpenChange(false);
    }

    if (!item) return null;

    // Handle other item types with direct edit
    let form: React.ReactNode = null;
    if (item.type === 'service') {
        form = <ServiceForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} />;
    } else if (item.type === 'currency') {
        form = <CurrencyForm initial={item} loading={loading} deleting={deleting} onSubmit={handleSave} onCancel={handleCancel} submitLabel={loading ? "Saving..." : "Save"} />;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                {/* Action buttons positioned absolutely */}
                <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                    {/* More actions dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={deleting || archiving || unarchiving}
                            >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {item.archived ? (
                                onItemUnarchived && (
                                    <DropdownMenuItem
                                        onSelect={handleUnarchive}
                                        disabled={unarchiving}
                                        className="flex items-center gap-2"
                                    >
                                        <Archive className="h-4 w-4" />
                                        {unarchiving ? "Unarchiving..." : "Unarchive item"}
                                    </DropdownMenuItem>
                                )
                            ) : (
                                onItemArchived && (
                                    <DropdownMenuItem
                                        onSelect={handleArchive}
                                        disabled={archiving}
                                        className="flex items-center gap-2"
                                    >
                                        <Archive className="h-4 w-4" />
                                        {archiving ? "Archiving..." : "Archive item"}
                                    </DropdownMenuItem>
                                )
                            )}
                            <DropdownMenuItem
                                onSelect={handleDelete}
                                disabled={deleting}
                                className="text-destructive focus:text-destructive flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                {deleting ? "Deleting..." : "Delete item"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>

                {/* Standard dialog header */}
                <DialogHeader className="pr-20">
                    <DialogTitle>Edit Item</DialogTitle>
                    <DialogDescription>
                        Edit the details of your item and save changes.
                    </DialogDescription>
                </DialogHeader>

                {form}
            </DialogContent>
        </Dialog>
    );
}
