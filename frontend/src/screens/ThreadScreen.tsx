import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, sizes } from "@/src/shared/designSystem";
import { threadStyles } from "@/src/shared/globalStyles";
import {
  useThread,
  useCreateComment,
  useLikeThread,
  useUnlikeThread,
  useLikeComment,
  useUnlikeComment,
} from "@/src/shared/hooks/useThreads";
import { Ionicons } from "@expo/vector-icons";

interface ThreadScreenProps {
  threadId: number;
  onBack?: () => void;
  showBackButton?: boolean;
  backgroundColor?: string;
}

export default function ThreadScreen({
  threadId,
  onBack,
  showBackButton = true,
  backgroundColor = "#FFE8E8",
}: ThreadScreenProps) {
  const { data: thread, isLoading, isError, error } = useThread(threadId);
  const [commentText, setCommentText] = useState("");

  // Mutations
  const createCommentMutation = useCreateComment(threadId);
  const likeThreadMutation = useLikeThread();
  const unlikeThreadMutation = useUnlikeThread();
  const likeCommentMutation = useLikeComment(threadId);
  const unlikeCommentMutation = useUnlikeComment(threadId);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      createCommentMutation.mutate(
        { content: commentText.trim() },
        {
          onSuccess: () => {
            setCommentText("");
          },
          onError: (error) => {
            Alert.alert("Error", "Failed to post comment. Please try again.");
            console.error("Comment error:", error);
          },
        },
      );
    }
  };

  const handleToggleThreadLike = () => {
    if (!thread) return;

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

  const handleToggleCommentLike = (commentId: number, isLiked: boolean) => {
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

  const weekRange = "Week 20-27"; // TODO: Extract from categories or thread metadata

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Back Button */}
        {showBackButton && (
          <TouchableOpacity onPress={handleBack} style={threadStyles.backButtonContainer}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={threadStyles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Thread Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={threadStyles.threadCard}>
            <Text style={threadStyles.threadTitle}>{thread.title}</Text>
            <Text style={threadStyles.threadContent}>{thread.content}</Text>
            <View style={threadStyles.threadMeta}>
              <Text style={threadStyles.metaText}>{thread.creator_fullname}</Text>
              <Text style={threadStyles.metaSeparator}>•</Text>
              <Text style={threadStyles.metaText}>{weekRange}</Text>
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
          </View>

          {/* Comments Section */}
          <View style={threadStyles.commentsSection}>
            {thread.comments && thread.comments.length > 0 ? (
              thread.comments.map((comment) => (
                <View key={comment.id} style={threadStyles.commentCard}>
                  <View style={threadStyles.commentHeader}>
                    <Text style={threadStyles.commentAuthor}>{comment.commenter_fullname}</Text>
                    <Text style={threadStyles.commentTime}>{formatTimeAgo(comment.commented_at.toString())}</Text>
                  </View>
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
                </View>
              ))
            ) : (
              <View style={threadStyles.noCommentsContainer}>
                <Text style={threadStyles.noCommentsText}>No comments yet. Be the first to comment!</Text>
              </View>
            )}
          </View>

          {/* Extra space for keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Comment Input */}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sizes.m,
  },
});
