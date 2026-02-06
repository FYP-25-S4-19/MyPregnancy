import { SafeAreaView } from "react-native-safe-area-context";
import { colors, sizes, font } from "@/src/shared/designSystem";
import { threadStyles } from "@/src/shared/globalStyles";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  useUnlikeComment,
  useCreateComment,
  useUnlikeThread,
  useLikeComment,
  useLikeThread,
  useThread,
} from "@/src/shared/hooks/useThreads";
import { router, usePathname } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/src/shared/authStore";
import { useGuestGate } from "@/src/shared/hooks/useGuestGate";
import utils from "@/src/shared/utils";
import {
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Text,
  View,
  Modal,
} from "react-native";
import api from "../shared/api";

interface ThreadScreenProps {
  threadId: number;
  onBack?: () => void;
  showBackButton?: boolean;
  backgroundColor?: string;
  isGuest?: boolean;
}

export default function ThreadScreen({
  threadId,
  onBack,
  showBackButton = true,
  backgroundColor = "#FFE8E8",
  isGuest = false,
}: ThreadScreenProps) {
  const { data: thread, isLoading, isError, error } = useThread(threadId);

  const [commentText, setCommentText] = useState<string>("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>("");
  const [menuVisibleCommentId, setMenuVisibleCommentId] = useState<number | null>(null);

  const me = useAuthStore((state) => state.me);
  const accessToken = useAuthStore((state) => state.accessToken);
  const pathname = usePathname();

  const isAuthed = useMemo(() => {
    if (!accessToken) return false;
    return utils.safeDecodeUnexpiredJWT(accessToken) !== null;
  }, [accessToken]);

  const queryClient = useQueryClient();
  const openGuestGate = useGuestGate((state) => state.open);

  // Mutations
  const createCommentMutation = useCreateComment(threadId);
  const likeThreadMutation = useLikeThread();
  const unlikeThreadMutation = useUnlikeThread();
  const likeCommentMutation = useLikeComment(threadId);
  const unlikeCommentMutation = useUnlikeComment(threadId);

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      await api.put(`/threads/${threadId}/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", threadId] });
      setEditingCommentId(null);
      setEditingCommentText("");
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to update comment. Please try again.");
      console.error("Update comment error:", error);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await api.delete(`/threads/${threadId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to delete comment. Please try again.");
      console.error("Delete comment error:", error);
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleBack = (): void => {
    if (onBack) onBack();
    else router.back();
  };

  const gateIfGuest = (): boolean => {
    if (isAuthed) return false;
    openGuestGate(pathname || `/main/(notab)/threads/${threadId}`);
    return true;
  };

  const handleSendComment = (): void => {
    if (gateIfGuest()) return;

    if (commentText.trim()) {
      createCommentMutation.mutate(
        { content: commentText.trim() },
        {
          onSuccess: () => setCommentText(""),
          onError: (error) => {
            Alert.alert("Error", "Failed to post comment. Please try again.");
            console.error("Comment error:", error);
          },
        },
      );
    }
  };

  const handleToggleThreadLike = (): void => {
    if (isGuest) {
      openGuestGate(`/main/(notab)/threads/${threadId}`);
      return;
    }

    if (!thread) return;
    if (gateIfGuest()) return;

    if (thread.is_liked_by_current_user) {
      unlikeThreadMutation.mutate(threadId, {
        onError: (error) => {
          Alert.alert("Error", "Failed to unlike thread. Please try again.");
          console.error("Unlike thread error:", error);
        },
      });
    } else {
      likeThreadMutation.mutate(threadId, {
        onError: (error) => {
          Alert.alert("Error", "Failed to like thread. Please try again.");
          console.error("Like thread error:", error);
        },
      });
    }
  };

  const handleToggleCommentLike = (commentId: number, isLiked: boolean): void => {
    if (gateIfGuest()) return;

    if (isLiked) {
      unlikeCommentMutation.mutate(commentId, {
        onError: (error) => {
          Alert.alert("Error", "Failed to unlike comment. Please try again.");
          console.error("Unlike comment error:", error);
        },
      });
    } else {
      likeCommentMutation.mutate(commentId, {
        onError: (error) => {
          Alert.alert("Error", "Failed to like comment. Please try again.");
          console.error("Like comment error:", error);
        },
      });
    }
  };

  const handleEditComment = (commentId: number, currentContent: string): void => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
    setMenuVisibleCommentId(null);
  };

  const handleSaveEditComment = (): void => {
    if (!isAuthed) return;
    if (editingCommentId && editingCommentText.trim()) {
      updateCommentMutation.mutate({
        commentId: editingCommentId,
        content: editingCommentText.trim(),
      });
    }
  };

  const handleCancelEditComment = (): void => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleDeleteComment = (commentId: number): void => {
    if (!isAuthed) return;
    setMenuVisibleCommentId(null);
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteCommentMutation.mutate(commentId),
      },
    ]);
  };

  const isCommentOwner = (commenterId: string): boolean => {
    return me?.id === commenterId;
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor }]}>
        <View style={threadStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !thread) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor }]}>
        <View style={threadStyles.errorContainer}>
          <Text style={threadStyles.errorText}>{error instanceof Error ? error.message : "Failed to load thread"}</Text>
          <TouchableOpacity onPress={handleBack} style={threadStyles.errorBackButton}>
            <Text style={threadStyles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryLabel = thread?.category?.label ?? "General";

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {showBackButton && (
          <TouchableOpacity onPress={handleBack} style={threadStyles.backButtonContainer}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={threadStyles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={threadStyles.threadCard}>
            <Text style={threadStyles.threadTitle}>{thread.title}</Text>
            <Text style={threadStyles.threadContent}>{thread.content}</Text>

            <View style={threadStyles.threadMeta}>
              <Text style={threadStyles.metaText}>{thread.creator_fullname}</Text>
              <Text style={threadStyles.metaSeparator}>•</Text>
              <Text style={threadStyles.metaText}>{categoryLabel}</Text>
              <Text style={threadStyles.metaSeparator}>•</Text>
              <Text style={threadStyles.metaText}>{formatTimeAgo(thread.posted_at.toString())}</Text>
            </View>

            <View style={threadStyles.threadActions}>
              <TouchableOpacity
                onPress={handleToggleThreadLike}
                style={threadStyles.likeButton}
                disabled={likeThreadMutation.isPending || unlikeThreadMutation.isPending}
              >
                <Ionicons
                  name={thread.is_liked_by_current_user ? "heart" : "heart-outline"}
                  size={20}
                  color={thread.is_liked_by_current_user ? colors.primary : colors.text}
                />
                <Text style={[threadStyles.likeCount, thread.is_liked_by_current_user && threadStyles.likeCountActive]}>
                  {thread.like_count || 0}
                </Text>
              </TouchableOpacity>

              <View style={threadStyles.commentCountContainer}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
                <Text style={threadStyles.commentCount}>{thread.comment_count || 0}</Text>
              </View>
            </View>

            {!isAuthed && (
              <Text style={{ marginTop: sizes.s, color: colors.text, opacity: 0.6, fontSize: font.xs }}>
                You’re viewing as guest. Sign in to like or comment.
              </Text>
            )}
          </View>

          <View style={threadStyles.commentsSection}>
            {thread.comments && thread.comments.length > 0 ? (
              thread.comments.map((comment) => (
                <View key={comment.id} style={threadStyles.commentCard}>
                  <View style={threadStyles.commentHeader}>
                    <View style={localStyles.commentHeaderLeft}>
                      <Text style={threadStyles.commentAuthor}>{comment.commenter_fullname}</Text>
                      <Text style={threadStyles.commentTime}>{formatTimeAgo(comment.commented_at.toString())}</Text>
                    </View>

                    {isAuthed && isCommentOwner(comment.commenter_id) && (
                      <TouchableOpacity
                        onPress={() => setMenuVisibleCommentId(comment.id)}
                        style={localStyles.menuButton}
                      >
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {editingCommentId === comment.id ? (
                    <View style={localStyles.editContainer}>
                      <TextInput
                        style={localStyles.editInput}
                        value={editingCommentText}
                        onChangeText={setEditingCommentText}
                        multiline
                        maxLength={500}
                        autoFocus
                      />
                      <View style={localStyles.editActions}>
                        <TouchableOpacity onPress={handleCancelEditComment} style={localStyles.cancelButton}>
                          <Text style={localStyles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSaveEditComment}
                          style={[
                            localStyles.saveButton,
                            (!editingCommentText.trim() || updateCommentMutation.isPending) &&
                              localStyles.saveButtonDisabled,
                          ]}
                          disabled={!editingCommentText.trim() || updateCommentMutation.isPending}
                        >
                          {updateCommentMutation.isPending ? (
                            <ActivityIndicator size="small" color={colors.white} />
                          ) : (
                            <Text style={localStyles.saveButtonText}>Save</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={threadStyles.commentContent}>{comment.content}</Text>
                      <TouchableOpacity
                        onPress={() => handleToggleCommentLike(comment.id, comment.is_liked_by_current_user)}
                        style={threadStyles.commentLikeButton}
                        disabled={likeCommentMutation.isPending || unlikeCommentMutation.isPending}
                      >
                        <Ionicons
                          name={comment.is_liked_by_current_user ? "heart" : "heart-outline"}
                          size={16}
                          color={comment.is_liked_by_current_user ? colors.primary : colors.text}
                        />
                        <Text
                          style={[
                            threadStyles.commentLikeCount,
                            comment.is_liked_by_current_user && threadStyles.commentLikeCountActive,
                          ]}
                        >
                          {comment.like_count || 0}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <Modal
                    visible={menuVisibleCommentId === comment.id}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setMenuVisibleCommentId(null)}
                  >
                    <TouchableOpacity
                      style={localStyles.modalOverlay}
                      activeOpacity={1}
                      onPress={() => setMenuVisibleCommentId(null)}
                    >
                      <View style={localStyles.menuContainer}>
                        <TouchableOpacity
                          style={localStyles.menuItem}
                          onPress={() => handleEditComment(comment.id, comment.content)}
                        >
                          <Ionicons name="pencil" size={20} color={colors.text} />
                          <Text style={localStyles.menuItemText}>Edit</Text>
                        </TouchableOpacity>
                        <View style={localStyles.menuDivider} />
                        <TouchableOpacity style={localStyles.menuItem} onPress={() => handleDeleteComment(comment.id)}>
                          <Ionicons name="trash" size={20} color="#E74C3C" />
                          <Text style={[localStyles.menuItemText, localStyles.deleteText]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </View>
              ))
            ) : (
              <View style={threadStyles.noCommentsContainer}>
                <Text style={threadStyles.noCommentsText}>No comments yet.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Comment Input */}
        {isAuthed ? (
          <View style={threadStyles.inputContainer}>
            <TextInput
              style={threadStyles.input}
              placeholder="Write a comment..."
              placeholderTextColor={colors.lightGray}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendComment}
              style={[
                threadStyles.sendButton,
                (!commentText.trim() || createCommentMutation.isPending) && threadStyles.sendButtonDisabled,
              ]}
              disabled={!commentText.trim() || createCommentMutation.isPending}
            >
              {createCommentMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[threadStyles.sendButtonText, !commentText.trim() && threadStyles.sendButtonTextDisabled]}>
                  Send
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={threadStyles.inputContainer}>
            <TextInput
              style={threadStyles.input}
              placeholder="Sign in to comment..."
              placeholderTextColor={colors.lightGray}
              editable={false}
            />
            <TouchableOpacity
              onPress={() => openGuestGate(`/main/(notab)/threads/${threadId}`)}
              style={threadStyles.sendButton}
              activeOpacity={0.7}
            >
              <Text style={threadStyles.sendButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: sizes.m },
});

const localStyles = StyleSheet.create({
  commentHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.s,
  },
  menuButton: { padding: sizes.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.s,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: { flexDirection: "row", alignItems: "center", padding: sizes.m, gap: sizes.m },
  menuItemText: { fontSize: font.m, color: colors.text },
  deleteText: { color: "#E74C3C" },
  menuDivider: { height: 1, backgroundColor: colors.lightGray },
  editContainer: { marginTop: sizes.s },
  editInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: sizes.s,
    padding: sizes.m,
    fontSize: font.s,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: sizes.s, marginTop: sizes.s },
  cancelButton: {
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    borderRadius: sizes.s,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  cancelButtonText: { fontSize: font.s, color: colors.text },
  saveButton: {
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    borderRadius: sizes.s,
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: font.s, color: colors.white, fontWeight: "600" },
  guestInputContainer: {},
  guestInputText: {},
});
