"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  createGuestAction,
  createInvitationGroupAction,
  updateGuestAction,
} from "@/lib/actions/guests";
import { updateInvitationGroupConfirmationAction } from "@/lib/actions/rsvp";
import { deleteGuestWithPrimaryTransferAction } from "@/lib/actions/guest-deletion";

import styles from "./guest-list.module.css";

export type GuestConfirmation =
  | "confirmed"
  | "pending"
  | "declined";

export type GuestSide = "bride" | "groom" | "both";

export type GuestRelationship =
  | "primary"
  | "spouse"
  | "boyfriend"
  | "girlfriend"
  | "fiance"
  | "fiancee"
  | "child"
  | "parent"
  | "sibling"
  | "relative"
  | "friend"
  | "plus_one"
  | "other";

export type SaveTheDateStatus =
  | "not_ready"
  | "ready"
  | "sent"
  | "delivered";

export type GuestAddress = {
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type InvitationGroup = {
  id: string;
  name: string;
  invitationCode: string;
  primaryGuestId?: string;
  saveTheDateStatus: SaveTheDateStatus;
  address?: GuestAddress;
};

export type GuestItem = {
  id: string;
  name: string;
  preferredName?: string;
  phone?: string;
  email?: string;
  group: string;
  side: GuestSide;
  confirmation: GuestConfirmation;
  table?: string;
  invitationGroupId: string;
  isPrimaryGuest: boolean;
  isChild: boolean;
  relationship: GuestRelationship;
  linkedGuestId?: string;
  relationshipLabel?: string;
  dietaryRestrictions?: string;
  notes?: string;
};

type GuestListProps = {
  guests: GuestItem[];
  invitationGroups: InvitationGroup[];
  brideName: string;
  groomName: string;
};

type ConfirmationFilter = "all" | GuestConfirmation;

type InvitationType = "single" | "group";
type InvitationGroupMode = "new" | "existing";

type AddGuestFormState = {
  invitationType: InvitationType;
  groupMode: InvitationGroupMode;
  invitationGroupId: string;
  groupName: string;
  invitationCode: string;

  fullName: string;
  preferredName: string;
  phone: string;
  email: string;

  side: GuestSide;
  confirmationStatus: GuestConfirmation;

  isPrimary: boolean;
  isChild: boolean;

  linkedGuestId: string;
  relationshipLabel: string;
  dietaryRestrictions: string;
  notes: string;
};

type EditGuestFormState = {
  fullName: string;
  preferredName: string;
  phone: string;
  email: string;
  side: GuestSide;
  confirmationStatus: GuestConfirmation;
  isChild: boolean;
  linkedGuestId: string;
  relationshipLabel: string;
  dietaryRestrictions: string;
  notes: string;
};

function createEmptyGuestForm(): AddGuestFormState {
  return {
    invitationType: "single",
    groupMode: "new",
    invitationGroupId: "",
    groupName: "",
    invitationCode: "",

    fullName: "",
    preferredName: "",
    phone: "",
    email: "",

    side: "both",
    confirmationStatus: "pending",

    isPrimary: true,
    isChild: false,

    linkedGuestId: "",
    relationshipLabel: "",
    dietaryRestrictions: "",
    notes: "",
  };
}

function createEditGuestForm(
  guest: GuestItem,
): EditGuestFormState {
  return {
    fullName: guest.name,
    preferredName: guest.preferredName ?? "",
    phone: guest.phone ?? "",
    email: guest.email ?? "",
    side: guest.side,
    confirmationStatus: guest.confirmation,
    isChild: guest.isChild,
    linkedGuestId: guest.linkedGuestId ?? "",
    relationshipLabel: guest.relationshipLabel ?? "",
    dietaryRestrictions:
      guest.dietaryRestrictions ?? "",
    notes: guest.notes ?? "",
  };
}

function createInvitationCode(name: string): string {
  const prefix = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("pt-BR")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");

  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${suffix}`;
}

const confirmationLabels: Record<GuestConfirmation, string> = {
  confirmed: "Confirmado",
  pending: "Aguardando",
  declined: "Não comparecerá",
};

const relationshipLabels: Record<GuestRelationship, string> = {
  primary: "Titular do convite",
  spouse: "Cônjuge",
  boyfriend: "Namorado",
  girlfriend: "Namorada",
  fiance: "Noivo",
  fiancee: "Noiva",
  child: "Filho(a)",
  parent: "Pai/mãe",
  sibling: "Irmão/irmã",
  relative: "Familiar",
  friend: "Amigo(a)",
  plus_one: "Acompanhante",
  other: "Outro vínculo",
};

const saveTheDateLabels: Record<SaveTheDateStatus, string> = {
  not_ready: "Endereço pendente",
  ready: "Pronto para envio",
  sent: "Save the Date enviado",
  delivered: "Save the Date entregue",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatAddress(address?: GuestAddress) {
  if (!address) {
    return "Endereço ainda não cadastrado.";
  }

  const street = [
    address.street,
    address.number,
    address.complement,
  ]
    .filter(Boolean)
    .join(", ");

  const cityAndState = [
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join("/");

  const locality = [
    address.neighborhood,
    cityAndState,
  ]
    .filter(Boolean)
    .join(", ");

  const postalCode = address.postalCode
    ? `CEP ${address.postalCode}`
    : "";

  return (
    [street, locality, postalCode]
      .filter(Boolean)
      .join(" — ") ||
    "Endereço ainda não cadastrado."
  );
}

export default function GuestList({
  guests: initialGuests,
  invitationGroups: initialInvitationGroups,
  brideName,
  groomName,
}: GuestListProps) {
  const router = useRouter();

  const [guests, setGuests] = useState<GuestItem[]>(
    initialGuests ?? [],
  );

  const [
    invitationGroups,
    setInvitationGroups,
  ] = useState<InvitationGroup[]>(
    initialInvitationGroups ?? [],
  );

  const [search, setSearch] = useState("");
  const [confirmationFilter, setConfirmationFilter] =
    useState<ConfirmationFilter>("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [
    selectedInvitationGroupId,
    setSelectedInvitationGroupId,
  ] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] =
    useState(false);

  const [isSavingGuest, setIsSavingGuest] =
    useState(false);

  const [addGuestError, setAddGuestError] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const [addGuestForm, setAddGuestForm] =
    useState<AddGuestFormState>(
      createEmptyGuestForm,
    );

  const [
    selectedGuestId,
    setSelectedGuestId,
  ] = useState<string | null>(null);

  const [
    editGuestForm,
    setEditGuestForm,
  ] = useState<EditGuestFormState | null>(
    null,
  );

  const [isUpdatingGuest, setIsUpdatingGuest] =
    useState(false);

  const [isDeletingGuest, setIsDeletingGuest] =
    useState(false);

  const [editGuestError, setEditGuestError] =
    useState<string | null>(null);

  const [
    replacementPrimaryGuestId,
    setReplacementPrimaryGuestId,
  ] = useState("");

  const [
    updatingGroupConfirmation,
    setUpdatingGroupConfirmation,
  ] = useState<GuestConfirmation | null>(
    null,
  );

  useEffect(() => {
    setGuests(initialGuests ?? []);
  }, [initialGuests]);

  useEffect(() => {
    setInvitationGroups(
      initialInvitationGroups ?? [],
    );
  }, [initialInvitationGroups]);

  const sideLabels: Record<GuestSide, string> = {
    bride: brideName,
    groom: groomName,
    both: "Casal",
  };

  const selectedGuest = useMemo(
    () =>
      guests.find(
        (guest) => guest.id === selectedGuestId,
      ) ?? null,
    [guests, selectedGuestId],
  );

  const selectedInvitationGroup = useMemo(
    () =>
      invitationGroups.find(
        (group) => group.id === selectedInvitationGroupId,
      ) ?? null,
    [invitationGroups, selectedInvitationGroupId],
  );

  const selectedGroupGuests = useMemo(
    () =>
      guests.filter(
        (guest) =>
          guest.invitationGroupId === selectedInvitationGroupId,
      ),
    [guests, selectedInvitationGroupId],
  );

  const groups = useMemo(
    () =>
      Array.from(new Set(guests.map((guest) => guest.group))).sort(),
    [guests],
  );

  function findGuest(guestId?: string) {
    if (!guestId) {
      return undefined;
    }

    return guests.find((guest) => guest.id === guestId);
  }

  function findInvitationGroup(invitationGroupId: string) {
    return invitationGroups.find(
      (group) => group.id === invitationGroupId,
    );
  }

  function getRelationshipText(guest: GuestItem) {
    if (guest.relationshipLabel?.trim()) {
      return guest.relationshipLabel;
    }

    if (guest.isPrimaryGuest || guest.relationship === "primary") {
      return "Titular do convite";
    }

    const linkedGuest = findGuest(guest.linkedGuestId);
    const label = relationshipLabels[guest.relationship];

    return linkedGuest ? `${label} de ${linkedGuest.name}` : label;
  }

  const filteredGuests = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return guests.filter((guest) => {
      const invitationGroup = findInvitationGroup(
        guest.invitationGroupId,
      );
      const linkedGuest = findGuest(guest.linkedGuestId);
      const searchableText = [
        guest.name,
        guest.phone,
        guest.email,
        guest.group,
        invitationGroup?.name,
        invitationGroup?.invitationCode,
        linkedGuest?.name,
        guest.relationshipLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const matchesConfirmation =
        confirmationFilter === "all" ||
        guest.confirmation === confirmationFilter;

      const matchesGroup =
        groupFilter === "all" || guest.group === groupFilter;

      return matchesSearch && matchesConfirmation && matchesGroup;
    });
  }, [
    guests,
    invitationGroups,
    search,
    confirmationFilter,
    groupFilter,
  ]);

  const confirmedGuests = guests.filter(
    (guest) => guest.confirmation === "confirmed",
  ).length;

  const pendingGuests = guests.filter(
    (guest) => guest.confirmation === "pending",
  ).length;

  const declinedGuests = guests.filter(
    (guest) => guest.confirmation === "declined",
  ).length;


  const availableLinkedGuests = useMemo(() => {
    if (
      addGuestForm.invitationType !== "group" ||
      addGuestForm.groupMode !== "existing" ||
      !addGuestForm.invitationGroupId
    ) {
      return [];
    }

    return guests.filter(
      (guest) =>
        guest.invitationGroupId ===
        addGuestForm.invitationGroupId,
    );
  }, [
    addGuestForm.invitationType,
    addGuestForm.groupMode,
    addGuestForm.invitationGroupId,
    guests,
  ]);

  const editLinkedGuests = useMemo(() => {
    if (!selectedGuest) {
      return [];
    }

    return guests.filter(
      (guest) =>
        guest.invitationGroupId ===
          selectedGuest.invitationGroupId &&
        guest.id !== selectedGuest.id,
    );
  }, [guests, selectedGuest]);


  const selectedGuestGroupGuests = useMemo(() => {
    if (!selectedGuest) {
      return [];
    }

    return guests.filter(
      (guest) =>
        guest.invitationGroupId ===
        selectedGuest.invitationGroupId,
    );
  }, [guests, selectedGuest]);

  const primaryReplacementCandidates = useMemo(
    () =>
      selectedGuestGroupGuests.filter(
        (guest) =>
          guest.id !== selectedGuest?.id,
      ),
    [selectedGuest, selectedGuestGroupGuests],
  );

  const requiresPrimaryTransfer = Boolean(
    selectedGuest?.isPrimaryGuest &&
      selectedGuestGroupGuests.length > 1,
  );

  function showFeedback(message: string) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }


  async function updateInvitationGroupConfirmation(
    confirmationStatus: GuestConfirmation,
  ) {
    if (
      !selectedInvitationGroup ||
      updatingGroupConfirmation !== null
    ) {
      return;
    }

    setUpdatingGroupConfirmation(
      confirmationStatus,
    );

    try {
      const result =
        await updateInvitationGroupConfirmationAction({
          invitationGroupId:
            selectedInvitationGroup.id,
          confirmationStatus,
        });

      if (!result.success) {
        showFeedback(result.message);
        return;
      }

      setGuests((currentGuests) =>
        currentGuests.map((guestItem) =>
          guestItem.invitationGroupId ===
          selectedInvitationGroup.id
            ? {
                ...guestItem,
                confirmation:
                  confirmationStatus,
              }
            : guestItem,
        ),
      );

      showFeedback(result.message);
      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao atualizar RSVP coletivo:",
        error,
      );

      showFeedback(
        "Não foi possível atualizar o RSVP do grupo.",
      );
    } finally {
      setUpdatingGroupConfirmation(null);
    }
  }

  function openAddGuestModal() {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setAddGuestForm(createEmptyGuestForm());
    setAddGuestError(null);
    setIsAddModalOpen(true);
  }

  function closeAddGuestModal() {
    if (isSavingGuest) {
      return;
    }

    setIsAddModalOpen(false);
    setAddGuestError(null);
  }

  function updateAddGuestForm<
    Key extends keyof AddGuestFormState,
  >(
    key: Key,
    value: AddGuestFormState[Key],
  ) {
    setAddGuestForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openEditGuestModal(
    guest: GuestItem,
  ) {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setSelectedInvitationGroupId(null);
    setSelectedGuestId(guest.id);
    setEditGuestForm(
      createEditGuestForm(guest),
    );
    setReplacementPrimaryGuestId("");
    setEditGuestError(null);
  }

  function closeEditGuestModal() {
    if (
      isUpdatingGuest ||
      isDeletingGuest
    ) {
      return;
    }

    setSelectedGuestId(null);
    setEditGuestForm(null);
    setReplacementPrimaryGuestId("");
    setEditGuestError(null);
  }

  function updateEditGuestForm<
    Key extends keyof EditGuestFormState,
  >(
    key: Key,
    value: EditGuestFormState[Key],
  ) {
    setEditGuestForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };
    });
  }

  async function handleUpdateGuest(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selectedGuest ||
      !editGuestForm ||
      isUpdatingGuest ||
      isDeletingGuest
    ) {
      return;
    }

    const fullName =
      editGuestForm.fullName.trim();

    if (fullName.length < 2) {
      setEditGuestError(
        "Informe o nome completo do convidado.",
      );
      return;
    }

    setIsUpdatingGuest(true);
    setEditGuestError(null);

    try {
      const result =
        await updateGuestAction({
          id: selectedGuest.id,
          invitationGroupId:
            selectedGuest.invitationGroupId,
          fullName,
          preferredName:
            editGuestForm.preferredName,
          email: editGuestForm.email,
          phone: editGuestForm.phone,
          side: editGuestForm.side,
          confirmationStatus:
            editGuestForm.confirmationStatus,
          isPrimary:
            selectedGuest.isPrimaryGuest,
          isChild:
            editGuestForm.isChild,
          linkedGuestId:
            editGuestForm.linkedGuestId,
          relationshipLabel:
            editGuestForm.relationshipLabel,
          dietaryRestrictions:
            editGuestForm.dietaryRestrictions,
          notes: editGuestForm.notes,
        });

      if (!result.success) {
        setEditGuestError(
          result.message,
        );
        return;
      }

      setSelectedGuestId(null);
      setEditGuestForm(null);
      setEditGuestError(null);

      showFeedback(
        "Convidado atualizado.",
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao atualizar convidado:",
        error,
      );

      setEditGuestError(
        "Não foi possível atualizar o convidado.",
      );
    } finally {
      setIsUpdatingGuest(false);
    }
  }

  async function handleDeleteGuest() {
    if (
      !selectedGuest ||
      isUpdatingGuest ||
      isDeletingGuest
    ) {
      return;
    }

    const deleteWholeInvitation =
      selectedGuestGroupGuests.length === 1;

    let replacementGuest: GuestItem | undefined;

    if (requiresPrimaryTransfer) {
      if (!replacementPrimaryGuestId) {
        setEditGuestError(
          "Selecione o novo titular do convite antes de excluir o titular atual.",
        );
        return;
      }

      replacementGuest =
        primaryReplacementCandidates.find(
          (guest) =>
            guest.id ===
            replacementPrimaryGuestId,
        );

      if (!replacementGuest) {
        setEditGuestError(
          "O novo titular selecionado não pertence a este grupo de convite.",
        );
        return;
      }
    }

    const confirmationMessage =
      deleteWholeInvitation
        ? `Excluir ${selectedGuest.name} e o convite associado?`
        : replacementGuest
          ? `Excluir ${selectedGuest.name} e transferir a titularidade do convite para ${replacementGuest.name}?`
          : `Excluir ${selectedGuest.name} da lista de convidados?`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setIsDeletingGuest(true);
    setEditGuestError(null);

    try {
      const result =
        await deleteGuestWithPrimaryTransferAction({
          guestId: selectedGuest.id,
          newPrimaryGuestId:
            replacementGuest?.id ?? null,
        });

      if (!result.success) {
        setEditGuestError(result.message);
        return;
      }

      setSelectedGuestId(null);
      setEditGuestForm(null);
      setReplacementPrimaryGuestId("");
      setEditGuestError(null);

      const feedbackMessage =
        result.outcome === "invitation_deleted"
          ? "Convidado e convite excluídos."
          : result.outcome === "primary_transferred"
            ? `Convidado excluído. ${replacementGuest?.name ?? "Outro convidado"} agora é o titular do convite.`
            : "Convidado excluído.";

      showFeedback(feedbackMessage);
      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao excluir convidado:",
        error,
      );

      setEditGuestError(
        "Não foi possível excluir o convidado.",
      );
    } finally {
      setIsDeletingGuest(false);
    }
  }

  function openSelectedGuestGroup() {
    if (!selectedGuest) {
      return;
    }

    const groupId =
      selectedGuest.invitationGroupId;

    closeEditGuestModal();
    setSelectedInvitationGroupId(
      groupId,
    );
  }

  async function handleAddGuest(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSavingGuest) {
      return;
    }

    const fullName = addGuestForm.fullName.trim();

    if (fullName.length < 2) {
      setAddGuestError(
        "Informe o nome completo do convidado.",
      );
      return;
    }

    if (
      addGuestForm.invitationType === "group" &&
      addGuestForm.groupMode === "new" &&
      addGuestForm.groupName.trim().length < 2
    ) {
      setAddGuestError(
        "Informe um nome para o grupo do convite.",
      );
      return;
    }

    setIsSavingGuest(true);
    setAddGuestError(null);

    try {
      let invitationGroupId =
        addGuestForm.invitationGroupId;

      const shouldCreateGroup =
        addGuestForm.invitationType === "single" ||
        addGuestForm.groupMode === "new";

      if (shouldCreateGroup) {
        const groupName =
          addGuestForm.invitationType === "single"
            ? fullName
            : addGuestForm.groupName.trim();

        const invitationCode =
          addGuestForm.invitationCode.trim() ||
          createInvitationCode(groupName);

        const groupResult =
          await createInvitationGroupAction({
            name: groupName,
            invitationCode,
            saveTheDateStatus: "not_ready",
            recipientName: groupName,
            postalCode: "",
            street: "",
            streetNumber: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
            notes: "",
          });

        if (!groupResult.success || !groupResult.id) {
          setAddGuestError(groupResult.message);
          return;
        }

        invitationGroupId = groupResult.id;
      }

      if (!invitationGroupId) {
        setAddGuestError(
          "Selecione um grupo de convite.",
        );
        return;
      }

      const isExistingGroup =
        addGuestForm.invitationType === "group" &&
        addGuestForm.groupMode === "existing";

      const guestResult = await createGuestAction({
        invitationGroupId,
        fullName,
        preferredName: addGuestForm.preferredName,
        email: addGuestForm.email,
        phone: addGuestForm.phone,
        side: addGuestForm.side,
        confirmationStatus:
          addGuestForm.confirmationStatus,
        isPrimary: !isExistingGroup,
        isChild: addGuestForm.isChild,
        linkedGuestId: isExistingGroup
          ? addGuestForm.linkedGuestId
          : "",
        relationshipLabel: isExistingGroup
          ? addGuestForm.relationshipLabel
          : "",
        dietaryRestrictions:
          addGuestForm.dietaryRestrictions,
        notes: addGuestForm.notes,
      });

      if (!guestResult.success) {
        setAddGuestError(guestResult.message);
        return;
      }

      setIsAddModalOpen(false);
      setAddGuestForm(createEmptyGuestForm());

      showFeedback(
        addGuestForm.invitationType === "single"
          ? "Convite único e convidado adicionados."
          : "Convidado adicionado ao grupo de convite.",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao adicionar convidado:",
        error,
      );

      setAddGuestError(
        "Não foi possível adicionar o convidado.",
      );
    } finally {
      setIsSavingGuest(false);
    }
  }


  function exportList() {
    const header = [
      "Convidado",
      "Grupo",
      "Grupo RSVP",
      "Código RSVP",
      "Vínculo",
      "Telefone",
      "E-mail",
      "Confirmação",
      "Mesa",
      "Endereço",
    ];

    const rows = guests.map((guest) => {
      const invitationGroup = findInvitationGroup(
        guest.invitationGroupId,
      );

      return [
        guest.name,
        guest.group,
        invitationGroup?.name ?? "",
        invitationGroup?.invitationCode ?? "",
        getRelationshipText(guest),
        guest.phone ?? "",
        guest.email ?? "",
        confirmationLabels[guest.confirmation],
        guest.table ?? "",
        formatAddress(invitationGroup?.address),
      ];
    });

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "lista-de-convidados.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      {feedback && (
        <div
          className={styles.feedback}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">✓</span>
          {feedback}
        </div>
      )}
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <span className="dashboard-eyebrow">Convidados</span>

          <h1>Lista de convidados</h1>

          <p>
            Cada pessoa aparece individualmente na lista. Os grupos são
            utilizados apenas para o RSVP e para o envio do Save the Date.
          </p>

          <button
            type="button"
            className={styles.addGuestButton}
            onClick={openAddGuestModal}
          >
            <span aria-hidden="true">＋</span>
            Adicionar convidado
          </button>
        </div>

        <div className={styles.headerSummary}>
          <div className={styles.totalGuestsCard}>
            <span>Total previsto</span>
            <strong>{guests.length}</strong>
            <p>{invitationGroups.length} convites cadastrados</p>
          </div>

          <div className={styles.headerStats}>
            <div>
              <span
                className={`${styles.statusDot} ${styles.confirmedDot}`}
              />
              <strong>{confirmedGuests}</strong>
              <span>Confirmados</span>
            </div>

            <div>
              <span
                className={`${styles.statusDot} ${styles.pendingDot}`}
              />
              <strong>{pendingGuests}</strong>
              <span>Aguardando</span>
            </div>

            <div>
              <span
                className={`${styles.statusDot} ${styles.declinedDot}`}
              />
              <strong>{declinedGuests}</strong>
              <span>Recusaram</span>
            </div>
          </div>
        </div>
      </header>

      <section
        className={styles.toolbar}
        aria-label="Filtros da lista de convidados"
      >
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            placeholder="Buscar convidado, vínculo ou código RSVP..."
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className={styles.filters}>
          {(
            [
              ["all", "Todos"],
              ["confirmed", "Confirmados"],
              ["pending", "Aguardando"],
              ["declined", "Recusaram"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterButton} ${
                confirmationFilter === value
                  ? styles.filterButtonActive
                  : ""
              }`}
              onClick={() => setConfirmationFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          className={styles.groupSelect}
          value={groupFilter}
          onChange={(event) => setGroupFilter(event.target.value)}
          aria-label="Filtrar por grupo"
        >
          <option value="all">Todos os grupos</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.listCard}>
        <header className={styles.listHeader}>
          <div>
            <span className="dashboard-eyebrow">Lista</span>
            <h2>
              {filteredGuests.length}{" "}
              {filteredGuests.length === 1
                ? "convidado encontrado"
                : "convidados encontrados"}
            </h2>
          </div>

          <button
            type="button"
            className={styles.exportButton}
            onClick={exportList}
          >
            Exportar lista
          </button>
        </header>

        {filteredGuests.length > 0 ? (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Convidado</th>
                    <th>Grupo</th>
                    <th>Vínculo / RSVP</th>
                    <th>Contato</th>
                    <th>Confirmação</th>
                    <th>Mesa</th>
                    <th>
                      <span className={styles.srOnly}>Ações</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGuests.map((guest) => {
                    const invitationGroup = findInvitationGroup(
                      guest.invitationGroupId,
                    );

                    return (
                      <tr key={guest.id}>
                        <td>
                          <div className={styles.guestIdentity}>
                            <span
                              className={styles.avatar}
                              aria-hidden="true"
                            >
                              {getInitials(guest.name)}
                            </span>

                            <div>
                              <strong>{guest.name}</strong>
                              <span>
                                Convidado de {sideLabels[guest.side]}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={styles.groupBadge}>
                            {guest.group}
                          </span>
                        </td>

                        <td>
                          <div className={styles.rsvpInfo}>
                            <strong>{getRelationshipText(guest)}</strong>
                            <span>
                              {invitationGroup?.name ?? "Grupo não definido"}
                            </span>
                            <div className={styles.rsvpMeta}>
                              <code>
                                {invitationGroup?.invitationCode ??
                                  "Sem código"}
                              </code>
                              <span
                                className={`${styles.saveTheDateBadge} ${
                                  styles[
                                    `saveTheDate-${
                                      invitationGroup?.saveTheDateStatus ??
                                      "not_ready"
                                    }`
                                  ]
                                }`}
                              >
                                {
                                  saveTheDateLabels[
                                    invitationGroup?.saveTheDateStatus ??
                                      "not_ready"
                                  ]
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={styles.contact}>
                            <span>{guest.phone || "Sem telefone"}</span>
                            {guest.email && <span>{guest.email}</span>}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`${styles.confirmationBadge} ${
                              styles[`confirmation-${guest.confirmation}`]
                            }`}
                          >
                            <span className={styles.statusDot} />
                            {confirmationLabels[guest.confirmation]}
                          </span>
                        </td>

                        <td>
                          {guest.table ? (
                            <span className={styles.tableBadge}>
                              {guest.table}
                            </span>
                          ) : (
                            <span className={styles.noTableLabel}>
                              Não definida
                            </span>
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className={styles.rowMenu}
                            aria-label={`Editar ${guest.name}`}
                            title="Editar ou excluir convidado"
                            onClick={() =>
                              openEditGuestModal(guest)
                            }
                          >
                            <span aria-hidden="true">•••</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileList}>
              {filteredGuests.map((guest) => {
                const invitationGroup = findInvitationGroup(
                  guest.invitationGroupId,
                );

                return (
                  <article key={guest.id} className={styles.mobileGuestCard}>
                    <header>
                      <div className={styles.guestIdentity}>
                        <span className={styles.avatar} aria-hidden="true">
                          {getInitials(guest.name)}
                        </span>

                        <div>
                          <strong>{guest.name}</strong>
                          <span>{getRelationshipText(guest)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.rowMenu}
                        aria-label={`Editar ${guest.name}`}
                        title="Editar ou excluir convidado"
                        onClick={() =>
                          openEditGuestModal(guest)
                        }
                      >
                        <span aria-hidden="true">•••</span>
                      </button>
                    </header>

                    <div className={styles.mobileGuestInfo}>
                      <span
                        className={`${styles.confirmationBadge} ${
                          styles[`confirmation-${guest.confirmation}`]
                        }`}
                      >
                        <span className={styles.statusDot} />
                        {confirmationLabels[guest.confirmation]}
                      </span>

                      <span>
                        RSVP: {invitationGroup?.name ?? "Não definido"}
                      </span>

                      <span>{guest.table || "Mesa não definida"}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <span aria-hidden="true">⌕</span>
            <strong>Nenhum convidado encontrado</strong>
            <p>Tente alterar a busca ou os filtros selecionados.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setConfirmationFilter("all");
                setGroupFilter("all");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {isAddModalOpen && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddGuestModal();
            }
          }}
        >
          <section
            className={`${styles.rsvpModal} ${styles.addGuestModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-guest-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <span className="dashboard-eyebrow">Cadastro</span>
                <h2 id="add-guest-title">Adicionar convidado</h2>
                <p>
                  Cadastre uma pessoa por vez. Em convites de casal ou
                  família, cada convidado continua com um registro
                  individual no banco.
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Fechar"
                onClick={closeAddGuestModal}
                disabled={isSavingGuest}
              >
                ×
              </button>
            </header>

            <form
              className={styles.addGuestForm}
              onSubmit={handleAddGuest}
            >
              <div className={styles.formGrid}>
                <fieldset className={styles.invitationTypeSection}>
                  <legend>Tipo de convite</legend>

                  <div className={styles.invitationTypeGrid}>
                    <button
                      type="button"
                      className={`${styles.invitationTypeCard} ${
                        addGuestForm.invitationType === "single"
                          ? styles.invitationTypeCardActive
                          : ""
                      }`}
                      aria-pressed={
                        addGuestForm.invitationType === "single"
                      }
                      onClick={() =>
                        setAddGuestForm((current) => ({
                          ...current,
                          invitationType: "single",
                          groupMode: "new",
                          invitationGroupId: "",
                          groupName: "",
                          isPrimary: true,
                          linkedGuestId: "",
                          relationshipLabel: "",
                        }))
                      }
                    >
                      <span
                        className={styles.invitationTypeIcon}
                        aria-hidden="true"
                      >
                        1
                      </span>

                      <span className={styles.invitationTypeCopy}>
                        <strong>Convite único</strong>
                        <small>
                          Um convidado, com código RSVP próprio.
                        </small>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.invitationTypeCard} ${
                        addGuestForm.invitationType === "group"
                          ? styles.invitationTypeCardActive
                          : ""
                      }`}
                      aria-pressed={
                        addGuestForm.invitationType === "group"
                      }
                      onClick={() =>
                        setAddGuestForm((current) => ({
                          ...current,
                          invitationType: "group",
                          groupMode: "new",
                          invitationGroupId: "",
                          isPrimary: true,
                          linkedGuestId: "",
                          relationshipLabel: "",
                        }))
                      }
                    >
                      <span
                        className={styles.invitationTypeIcon}
                        aria-hidden="true"
                      >
                        2+
                      </span>

                      <span className={styles.invitationTypeCopy}>
                        <strong>Convite em grupo</strong>
                        <small>
                          Casal ou família no mesmo RSVP, com cada
                          pessoa cadastrada individualmente.
                        </small>
                      </span>
                    </button>
                  </div>
                </fieldset>

                {addGuestForm.invitationType === "single" ? (
                  <div className={styles.invitationConfiguration}>
                    <div className={styles.configurationHeader}>
                      <div>
                        <strong>Convite individual</strong>
                        <span>
                          O sistema criará automaticamente um grupo
                          exclusivo para este convidado.
                        </span>
                      </div>
                    </div>

                    <label className={styles.fullField}>
                      <span>Código RSVP</span>
                      <div className={styles.codeField}>
                        <input
                          type="text"
                          value={addGuestForm.invitationCode}
                          placeholder="Gerado automaticamente ao salvar"
                          onChange={(event) =>
                            updateAddGuestForm(
                              "invitationCode",
                              event.target.value
                                .toLocaleUpperCase("pt-BR")
                                .replace(/[^A-Z0-9-]/g, ""),
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            updateAddGuestForm(
                              "invitationCode",
                              createInvitationCode(
                                addGuestForm.fullName ||
                                  "CONVITE",
                              ),
                            )
                          }
                        >
                          Gerar código
                        </button>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className={styles.invitationConfiguration}>
                    <div className={styles.groupModeTabs}>
                      <button
                        type="button"
                        className={
                          addGuestForm.groupMode === "new"
                            ? styles.groupModeTabActive
                            : ""
                        }
                        onClick={() =>
                          setAddGuestForm((current) => ({
                            ...current,
                            groupMode: "new",
                            invitationGroupId: "",
                            isPrimary: true,
                            linkedGuestId: "",
                            relationshipLabel: "",
                          }))
                        }
                      >
                        Criar novo grupo
                      </button>

                      <button
                        type="button"
                        disabled={invitationGroups.length === 0}
                        className={
                          addGuestForm.groupMode === "existing"
                            ? styles.groupModeTabActive
                            : ""
                        }
                        onClick={() =>
                          setAddGuestForm((current) => ({
                            ...current,
                            groupMode: "existing",
                            invitationGroupId:
                              invitationGroups[0]?.id ?? "",
                            isPrimary: false,
                            linkedGuestId: "",
                            relationshipLabel: "",
                          }))
                        }
                      >
                        Usar grupo existente
                      </button>
                    </div>

                    {addGuestForm.groupMode === "new" ? (
                      <div className={styles.configurationGrid}>
                        <label>
                          <span>Nome do grupo *</span>
                          <input
                            type="text"
                            required
                            minLength={2}
                            value={addGuestForm.groupName}
                            placeholder="Ex.: Família Silva"
                            onChange={(event) =>
                              updateAddGuestForm(
                                "groupName",
                                event.target.value,
                              )
                            }
                          />
                          <small>
                            O primeiro convidado será o titular do grupo.
                          </small>
                        </label>

                        <label>
                          <span>Código RSVP</span>
                          <div className={styles.codeField}>
                            <input
                              type="text"
                              value={addGuestForm.invitationCode}
                              placeholder="Gerado automaticamente"
                              onChange={(event) =>
                                updateAddGuestForm(
                                  "invitationCode",
                                  event.target.value
                                    .toLocaleUpperCase("pt-BR")
                                    .replace(/[^A-Z0-9-]/g, ""),
                                )
                              }
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateAddGuestForm(
                                  "invitationCode",
                                  createInvitationCode(
                                    addGuestForm.groupName ||
                                      addGuestForm.fullName ||
                                      "CONVITE",
                                  ),
                                )
                              }
                            >
                              Gerar
                            </button>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <label className={styles.fullField}>
                        <span>Grupo de convite *</span>
                        <select
                          required
                          value={addGuestForm.invitationGroupId}
                          onChange={(event) => {
                            updateAddGuestForm(
                              "invitationGroupId",
                              event.target.value,
                            );
                            updateAddGuestForm(
                              "linkedGuestId",
                              "",
                            );
                          }}
                        >
                          <option value="">Selecione um grupo</option>

                          {invitationGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name} — {group.invitationCode}
                            </option>
                          ))}
                        </select>

                        <small>
                          O novo convidado terá seu próprio registro e
                          compartilhará somente o código RSVP do grupo.
                        </small>
                      </label>
                    )}
                  </div>
                )}

                <div className={styles.formDivider}>
                  Dados pessoais
                </div>

                <label className={styles.fullField}>
                  <span>Nome completo *</span>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={150}
                    value={addGuestForm.fullName}
                    onChange={(event) =>
                      updateAddGuestForm(
                        "fullName",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Nome preferido</span>
                  <input
                    type="text"
                    value={addGuestForm.preferredName}
                    onChange={(event) =>
                      updateAddGuestForm(
                        "preferredName",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Telefone</span>
                  <input
                    type="tel"
                    value={addGuestForm.phone}
                    onChange={(event) =>
                      updateAddGuestForm(
                        "phone",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={addGuestForm.email}
                    onChange={(event) =>
                      updateAddGuestForm(
                        "email",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Convidado de</span>
                  <select
                    value={addGuestForm.side}
                    onChange={(event) =>
                      updateAddGuestForm(
                        "side",
                        event.target.value as GuestSide,
                      )
                    }
                  >
                    <option value="bride">{brideName}</option>
                    <option value="groom">{groomName}</option>
                    <option value="both">Casal</option>
                  </select>
                </label>

                <label>
                  <span>Confirmação</span>
                  <select
                    value={addGuestForm.confirmationStatus}
                    onChange={(event) =>
                      updateAddGuestForm(
                        "confirmationStatus",
                        event.target
                          .value as GuestConfirmation,
                      )
                    }
                  >
                    <option value="pending">Aguardando</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="declined">Não comparecerá</option>
                  </select>
                </label>

                {addGuestForm.invitationType === "group" &&
                  addGuestForm.groupMode === "existing" && (
                  <>
                    <label>
                      <span>Vinculado a</span>
                      <select
                        value={addGuestForm.linkedGuestId}
                        onChange={(event) =>
                          updateAddGuestForm(
                            "linkedGuestId",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">Sem vínculo</option>
                        {availableLinkedGuests.map((guest) => (
                          <option key={guest.id} value={guest.id}>
                            {guest.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Descrição do vínculo</span>
                      <input
                        type="text"
                        placeholder="Ex.: Esposa de João"
                        value={addGuestForm.relationshipLabel}
                        onChange={(event) =>
                          updateAddGuestForm(
                            "relationshipLabel",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </>
                )}

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxField}>
                    <input
                      type="checkbox"
                      checked={addGuestForm.isChild}
                      onChange={(event) =>
                        updateAddGuestForm(
                          "isChild",
                          event.target.checked,
                        )
                      }
                    />
                    <span>É criança</span>
                  </label>
                </div>

                <label className={styles.fullField}>
                  <span>Restrições alimentares</span>
                  <textarea
                    rows={3}
                    value={addGuestForm.dietaryRestrictions}
                    onChange={(event) =>
                      updateAddGuestForm(
                        "dietaryRestrictions",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className={styles.fullField}>
                  <span>Observações</span>
                  <textarea
                    rows={3}
                    value={addGuestForm.notes}
                    onChange={(event) =>
                      updateAddGuestForm(
                        "notes",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              {addGuestError && (
                <div
                  className={styles.modalError}
                  role="alert"
                >
                  {addGuestError}
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeAddGuestModal}
                  disabled={isSavingGuest}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isSavingGuest}
                >
                  {isSavingGuest
                    ? "Salvando..."
                    : "Adicionar convidado"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedGuest && editGuestForm && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditGuestModal();
            }
          }}
        >
          <section
            className={`${styles.rsvpModal} ${styles.addGuestModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-guest-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <span className="dashboard-eyebrow">
                  Convidado
                </span>

                <h2 id="edit-guest-title">
                  Editar convidado
                </h2>

                <p>
                  Atualize os dados individuais de{" "}
                  <strong>
                    {selectedGuest.name}
                  </strong>
                  .
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Fechar"
                onClick={closeEditGuestModal}
                disabled={
                  isUpdatingGuest ||
                  isDeletingGuest
                }
              >
                ×
              </button>
            </header>

            <form
              className={styles.addGuestForm}
              onSubmit={handleUpdateGuest}
            >
              <div
                className={
                  styles.editGuestSummary
                }
              >
                <div>
                  <span>
                    Grupo de convite
                  </span>

                  <strong>
                    {
                      findInvitationGroup(
                        selectedGuest.invitationGroupId,
                      )?.name
                    }
                  </strong>

                  <small>
                    Código RSVP:{" "}
                    {findInvitationGroup(
                      selectedGuest.invitationGroupId,
                    )?.invitationCode ??
                      "Sem código"}
                  </small>
                </div>

                <button
                  type="button"
                  onClick={
                    openSelectedGuestGroup
                  }
                >
                  Ver grupo RSVP
                </button>
              </div>

              <div className={styles.formGrid}>
                <label
                  className={styles.fullField}
                >
                  <span>
                    Nome completo *
                  </span>

                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={150}
                    value={
                      editGuestForm.fullName
                    }
                    onChange={(event) =>
                      updateEditGuestForm(
                        "fullName",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Nome preferido
                  </span>

                  <input
                    type="text"
                    value={
                      editGuestForm.preferredName
                    }
                    onChange={(event) =>
                      updateEditGuestForm(
                        "preferredName",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Telefone</span>

                  <input
                    type="tel"
                    value={
                      editGuestForm.phone
                    }
                    onChange={(event) =>
                      updateEditGuestForm(
                        "phone",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>E-mail</span>

                  <input
                    type="email"
                    value={
                      editGuestForm.email
                    }
                    onChange={(event) =>
                      updateEditGuestForm(
                        "email",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Convidado de
                  </span>

                  <select
                    value={
                      editGuestForm.side
                    }
                    onChange={(event) =>
                      updateEditGuestForm(
                        "side",
                        event.target
                          .value as GuestSide,
                      )
                    }
                  >
                    <option value="bride">
                      {brideName}
                    </option>

                    <option value="groom">
                      {groomName}
                    </option>

                    <option value="both">
                      Casal
                    </option>
                  </select>
                </label>

                <label>
                  <span>Confirmação</span>

                  <select
                    value={
                      editGuestForm.confirmationStatus
                    }
                    onChange={(event) =>
                      updateEditGuestForm(
                        "confirmationStatus",
                        event.target
                          .value as GuestConfirmation,
                      )
                    }
                  >
                    <option value="pending">
                      Aguardando
                    </option>

                    <option value="confirmed">
                      Confirmado
                    </option>

                    <option value="declined">
                      Não comparecerá
                    </option>
                  </select>
                </label>

                {!selectedGuest.isPrimaryGuest && (
                  <>
                    <label>
                      <span>
                        Vinculado a
                      </span>

                      <select
                        value={
                          editGuestForm.linkedGuestId
                        }
                        onChange={(event) =>
                          updateEditGuestForm(
                            "linkedGuestId",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">
                          Sem vínculo
                        </option>

                        {editLinkedGuests.map(
                          (guest) => (
                            <option
                              key={guest.id}
                              value={guest.id}
                            >
                              {guest.name}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      <span>
                        Descrição do vínculo
                      </span>

                      <input
                        type="text"
                        placeholder="Ex.: Esposa de João"
                        value={
                          editGuestForm.relationshipLabel
                        }
                        onChange={(event) =>
                          updateEditGuestForm(
                            "relationshipLabel",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </>
                )}

                <div
                  className={
                    styles.checkboxGroup
                  }
                >
                  <label
                    className={
                      styles.checkboxField
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        editGuestForm.isChild
                      }
                      onChange={(event) =>
                        updateEditGuestForm(
                          "isChild",
                          event.target.checked,
                        )
                      }
                    />

                    <span>É criança</span>
                  </label>

                  {selectedGuest.isPrimaryGuest && (
                    <span
                      className={
                        styles.primaryGuestNotice
                      }
                    >
                      Titular do convite
                    </span>
                  )}
                </div>

                <label
                  className={styles.fullField}
                >
                  <span>
                    Restrições alimentares
                  </span>

                  <textarea
                    rows={3}
                    value={
                      editGuestForm.dietaryRestrictions
                    }
                    onChange={(event) =>
                      updateEditGuestForm(
                        "dietaryRestrictions",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label
                  className={styles.fullField}
                >
                  <span>Observações</span>

                  <textarea
                    rows={3}
                    value={
                      editGuestForm.notes
                    }
                    onChange={(event) =>
                      updateEditGuestForm(
                        "notes",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              {requiresPrimaryTransfer && (
                <section
                  className={
                    styles.primaryTransferProtection
                  }
                  aria-labelledby="primary-transfer-title"
                >
                  <div>
                    <span
                      className={
                        styles.primaryTransferIcon
                      }
                      aria-hidden="true"
                    >
                      !
                    </span>

                    <div>
                      <strong id="primary-transfer-title">
                        Proteção do titular
                      </strong>

                      <p>
                        Este convite possui outras pessoas. Para excluir o titular atual, escolha quem assumirá a titularidade. Os vínculos que apontam para o titular atual serão transferidos para a pessoa escolhida.
                      </p>
                    </div>
                  </div>

                  <label>
                    <span>Novo titular do convite *</span>

                    <select
                      value={
                        replacementPrimaryGuestId
                      }
                      onChange={(event) => {
                        setReplacementPrimaryGuestId(
                          event.target.value,
                        );
                        setEditGuestError(null);
                      }}
                      disabled={
                        isUpdatingGuest ||
                        isDeletingGuest
                      }
                    >
                      <option value="">
                        Selecione uma pessoa
                      </option>

                      {primaryReplacementCandidates.map(
                        (guest) => (
                          <option
                            key={guest.id}
                            value={guest.id}
                          >
                            {guest.name}
                            {guest.isChild
                              ? " — criança"
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </section>
              )}

              {editGuestError && (
                <div
                  className={
                    styles.modalError
                  }
                  role="alert"
                >
                  {editGuestError}
                </div>
              )}

              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.deleteButton
                  }
                  onClick={
                    handleDeleteGuest
                  }
                  disabled={
                    isUpdatingGuest ||
                    isDeletingGuest
                  }
                >
                  {isDeletingGuest
                    ? "Excluindo..."
                    : "Excluir convidado"}
                </button>

                <div
                  className={
                    styles.modalPrimaryActions
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.cancelButton
                    }
                    onClick={
                      closeEditGuestModal
                    }
                    disabled={
                      isUpdatingGuest ||
                      isDeletingGuest
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className={
                      styles.saveButton
                    }
                    disabled={
                      isUpdatingGuest ||
                      isDeletingGuest
                    }
                  >
                    {isUpdatingGuest
                      ? "Salvando..."
                      : "Salvar alterações"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedInvitationGroup && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedInvitationGroupId(null);
            }
          }}
        >
          <section
            className={styles.rsvpModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rsvp-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <span className="dashboard-eyebrow">Grupo de convite</span>
                <h2 id="rsvp-modal-title">
                  {selectedInvitationGroup.name}
                </h2>
                <p>
                  Código RSVP: <strong>{selectedInvitationGroup.invitationCode}</strong>
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Fechar"
                onClick={() => setSelectedInvitationGroupId(null)}
              >
                ×
              </button>
            </header>

            <div className={styles.modalContent}>
              <section className={styles.modalSection}>
                <div className={styles.modalSectionHeader}>
                  <div>
                    <span className="dashboard-eyebrow">RSVP conjunto</span>
                    <h3>Pessoas deste convite</h3>
                  </div>
                </div>

                <div className={styles.groupGuestList}>
                  {selectedGroupGuests.map((guest) => (
                    <div key={guest.id} className={styles.groupGuestItem}>
                      <span className={styles.avatar} aria-hidden="true">
                        {getInitials(guest.name)}
                      </span>
                      <div>
                        <strong>{guest.name}</strong>
                        <span>{getRelationshipText(guest)}</span>
                      </div>
                      <span
                        className={`${styles.confirmationBadge} ${
                          styles[`confirmation-${guest.confirmation}`]
                        }`}
                      >
                        <span className={styles.statusDot} />
                        {confirmationLabels[guest.confirmation]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.groupConfirmationActions}>
                  <button
                    type="button"
                    disabled={
                      updatingGroupConfirmation !== null ||
                      selectedGroupGuests.length === 0
                    }
                    onClick={() =>
                      updateInvitationGroupConfirmation(
                        "confirmed",
                      )
                    }
                  >
                    {updatingGroupConfirmation ===
                    "confirmed"
                      ? "Atualizando..."
                      : "Confirmar todos"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      updatingGroupConfirmation !== null ||
                      selectedGroupGuests.length === 0
                    }
                    onClick={() =>
                      updateInvitationGroupConfirmation(
                        "pending",
                      )
                    }
                  >
                    {updatingGroupConfirmation ===
                    "pending"
                      ? "Atualizando..."
                      : "Colocar todos como aguardando"}
                  </button>

                  <button
                    type="button"
                    className={styles.declineGroupButton}
                    disabled={
                      updatingGroupConfirmation !== null ||
                      selectedGroupGuests.length === 0
                    }
                    onClick={() =>
                      updateInvitationGroupConfirmation(
                        "declined",
                      )
                    }
                  >
                    {updatingGroupConfirmation ===
                    "declined"
                      ? "Atualizando..."
                      : "Marcar todos como ausentes"}
                  </button>
                </div>
              </section>

              <section className={styles.modalSection}>
                <div className={styles.modalSectionHeader}>
                  <div>
                    <span className="dashboard-eyebrow">Save the Date</span>
                    <h3>Endereço de entrega</h3>
                  </div>

                  <span
                    className={`${styles.saveTheDateBadge} ${
                      styles[
                        `saveTheDate-${
                          selectedInvitationGroup.saveTheDateStatus
                        }`
                      ]
                    }`}
                  >
                    {
                      saveTheDateLabels[
                        selectedInvitationGroup.saveTheDateStatus
                      ]
                    }
                  </span>
                </div>

                {selectedInvitationGroup.address ? (
                  <address className={styles.addressCard}>
                    <strong>
                      {selectedInvitationGroup.address.recipientName}
                    </strong>
                    <span>
                      {formatAddress(selectedInvitationGroup.address)}
                    </span>
                  </address>
                ) : (
                  <div className={styles.missingAddress}>
                    <strong>Endereço não cadastrado</strong>
                    <p>
                      Cadastre o endereço deste grupo antes de preparar o
                      Save the Date.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}