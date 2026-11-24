import { FormEvent, useState } from 'react';
import {
  Calendar,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Pin,
  Send,
} from 'lucide-react';
import { MathEvent, Member, Post, PostCategory } from '../types';
import { AppStrings } from '../utils/i18n';
import { formatRelativeTime, validatePostInput } from '../utils/mathLogic';

interface FeedSectionProps {
  posts: Post[];
  events: MathEvent[];
  activeMember: Member | null;
  likedPostIds: string[];
  strings: AppStrings;
  onCreatePost: (payload: {
    authorName: string;
    authorGotra?: string;
    authorCity?: string;
    category: PostCategory;
    title: string;
    content: string;
    imageUrl?: string;
  }) => Promise<void>;
  onToggleLike: (postId: string) => Promise<void>;
  onAddComment: (postId: string, text: string, authorName: string) => Promise<void>;
  onGoToMembership: () => void;
}

const IMAGE_PRESETS = [
  { label: 'No Photo', value: '' },
  {
    label: 'Math Courtyard',
    value: '/src/assets/images/math_sanctum_banner_1795533370707.jpg',
  },
  {
    label: 'Satsang & Prasad',
    value: '/src/assets/images/community_satsang_event_1795533370501.jpg',
  },
  {
    label: 'Deepdan Diya',
    value: '/src/assets/images/donation_diya_seva_1795533370939.jpg',
  },
];

export function FeedSection({
  posts,
  events,
  activeMember,
  likedPostIds,
  strings,
  onCreatePost,
  onToggleLike,
  onAddComment,
  onGoToMembership,
}: FeedSectionProps) {
  const [filter, setFilter] = useState<'ALL' | PostCategory>('ALL');
  const [composerOpen, setComposerOpen] = useState(false);

  const [authorName, setAuthorName] = useState(activeMember?.name || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>(PostCategory.Community);
  const [imagePreset, setImagePreset] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentAuthorDrafts, setCommentAuthorDrafts] = useState<Record<string, string>>({});
  const [commentError, setCommentError] = useState<Record<string, string>>({});

  const filteredPosts =
    filter === 'ALL' ? posts : posts.filter((post) => post.category === filter);

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    const resolvedAuthor = (activeMember?.name || authorName).trim();
    const check = validatePostInput({
      authorName: resolvedAuthor,
      title,
      content,
      category,
    });
    if (!check.valid) {
      setFormError(Object.values(check.errors)[0] || 'Please check post fields.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onCreatePost({
        authorName: resolvedAuthor,
        authorGotra: activeMember?.gotra,
        authorCity: activeMember?.city,
        category,
        title: title.trim(),
        content: content.trim(),
        imageUrl: imagePreset || undefined,
      });
      setTitle('');
      setContent('');
      setImagePreset('');
      setComposerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to publish update.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e: FormEvent, postId: string) => {
    e.preventDefault();
    const text = (commentDrafts[postId] || '').trim();
    const commenter = (
      activeMember?.name ||
      commentAuthorDrafts[postId] ||
      ''
    ).trim();

    if (commenter.length < 2) {
      setCommentError((prev) => ({ ...prev, [postId]: 'Enter your name to comment.' }));
      return;
    }
    if (text.length < 2) {
      setCommentError((prev) => ({ ...prev, [postId]: 'Write a comment first.' }));
      return;
    }

    setCommentError((prev) => ({ ...prev, [postId]: '' }));
    await onAddComment(postId, text, commenter);
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Kutumb Feed Column */}
      <div className="lg:col-span-8 space-y-5">
        {/* Header & Composer Toggle */}
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#1E1B18]">{strings.feedTitle}</h2>
              <p className="text-sm text-[#645D55]">{strings.feedSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen((prev) => !prev)}
              aria-expanded={composerOpen}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {composerOpen ? strings.closeComposerBtn : strings.writePostBtn}
            </button>
          </div>

          {composerOpen && (
            <form onSubmit={handlePublish} className="mt-5 pt-5 border-t border-[#E6E2DA] space-y-4">
              {!activeMember && (
                <div>
                  <label
                    htmlFor="post-author"
                    className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                  >
                    Your Name
                  </label>
                  <input
                    id="post-author"
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Suresh Tiwari"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="post-category"
                    className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="post-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PostCategory)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
                  >
                    {Object.values(PostCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="post-image-preset"
                    className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                  >
                    Attach Photo (Optional)
                  </label>
                  <div className="relative">
                    <select
                      id="post-image-preset"
                      value={imagePreset}
                      onChange={(e) => setImagePreset(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
                    >
                      {IMAGE_PRESETS.map((preset) => (
                        <option key={preset.label} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="post-title"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  Headline
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Write a clear post headline"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div>
                <label
                  htmlFor="post-content"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="post-content"
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share community news, bhajan timings, or seva updates..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              {formError && (
                <p role="alert" className="text-sm text-[#B91C1C] font-medium">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E6E2DA] text-sm font-medium text-[#645D55] hover:bg-[#FAF9F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{submitting ? 'Publishing...' : 'Publish Update'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div
          className="flex items-center gap-1 p-1 bg-[#EFECE5] rounded-xl overflow-x-auto"
          role="tablist"
          aria-label="Filter community posts"
        >
          {(['ALL', ...Object.values(PostCategory)] as const).map((tab) => {
            const active = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-[#1E1B18] shadow-xs'
                    : 'text-[#645D55] hover:text-[#1E1B18]'
                }`}
              >
                {tab === 'ALL' ? strings.allUpdatesTab : tab}
              </button>
            );
          })}
        </div>

        {/* Feed Post Cards */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-8 text-center">
            <p className="text-base font-medium text-[#1E1B18]">
              No posts in this category yet.
            </p>
            <p className="text-sm text-[#645D55] mt-1">
              Use &ldquo;Write Post&rdquo; above to share the first community update.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const isLiked = likedPostIds.includes(post.id);
              const commentsOpen = Boolean(expandedComments[post.id]);

              return (
                <article
                  key={post.id}
                  data-testid={`post-card-${post.id}`}
                  className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden"
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Unboxed inline metadata kicker */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#645D55]">
                        <span className="font-semibold text-[#1E1B18] text-sm">
                          {post.authorName}
                        </span>
                        {post.authorGotra && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{post.authorGotra} Gotra</span>
                          </>
                        )}
                        {post.authorCity && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{post.authorCity}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                      </div>

                      {post.pinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B45309] shrink-0">
                          <Pin className="w-3.5 h-3.5" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-[#1E1B18] leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-[15px] text-[#3F3A34] leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  {post.imageUrl && (
                    <div className="border-y border-[#E6E2DA] bg-[#EFECE5] aspect-[16/9] overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="px-4 sm:px-5 py-2.5 flex items-center gap-3 border-t border-[#F1EDE4]">
                    <button
                      type="button"
                      onClick={() => onToggleLike(post.id)}
                      aria-label={`Like ${post.title}`}
                      aria-pressed={isLiked}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
                        isLiked
                          ? 'text-[#C2410C] bg-orange-50'
                          : 'text-[#645D55] hover:bg-[#FAF9F6] hover:text-[#1E1B18]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="tabular-nums">{post.likes} Likes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id],
                        }))
                      }
                      aria-expanded={commentsOpen}
                      aria-label={`Comments for ${post.title}`}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-[#645D55] hover:bg-[#FAF9F6] hover:text-[#1E1B18] inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="tabular-nums">
                        {post.comments.length}{' '}
                        {post.comments.length === 1 ? 'Comment' : 'Comments'}
                      </span>
                    </button>
                  </div>

                  {/* Comments Thread */}
                  {commentsOpen && (
                    <div className="px-4 sm:px-5 py-4 bg-[#FAF9F6] border-t border-[#E6E2DA] space-y-3">
                      {post.comments.length === 0 ? (
                        <p className="text-xs text-[#645D55]">
                          No comments yet. Share your blessings or reply below.
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {post.comments.map((comment) => (
                            <li
                              key={comment.id}
                              className="text-sm bg-white border border-[#E6E2DA] rounded-xl px-3.5 py-2.5"
                            >
                              <div className="flex items-center gap-2 text-xs text-[#645D55] mb-1">
                                <span className="font-semibold text-[#1E1B18]">
                                  {comment.authorName}
                                </span>
                                {comment.authorCity && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{comment.authorCity}</span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                <span>{formatRelativeTime(comment.createdAt)}</span>
                              </div>
                              <p className="text-[#3F3A34]">{comment.text}</p>
                            </li>
                          ))}
                        </ul>
                      )}

                      <form
                        onSubmit={(e) => handleCommentSubmit(e, post.id)}
                        className="space-y-2 pt-1"
                      >
                        {!activeMember && (
                          <input
                            type="text"
                            value={commentAuthorDrafts[post.id] || ''}
                            onChange={(e) =>
                              setCommentAuthorDrafts((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            aria-label="Your name for comment"
                            placeholder="Your name"
                            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E6E2DA] bg-white text-sm focus:outline-none focus:border-[#C2410C]"
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentDrafts[post.id] || ''}
                            onChange={(e) =>
                              setCommentDrafts((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            aria-label={`Write a comment on ${post.title}`}
                            placeholder="Write a respectful reply..."
                            className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-white text-sm focus:outline-none focus:border-[#C2410C]"
                          />
                          <button
                            type="submit"
                            aria-label={`Submit comment on ${post.title}`}
                            className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">Send</span>
                          </button>
                        </div>
                        {commentError[post.id] && (
                          <p role="alert" className="text-xs text-[#B91C1C]">
                            {commentError[post.id]}
                          </p>
                        )}
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar: Math Events & Active Member Summary */}
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E1B18]">{strings.upcomingGatherings}</h3>
            <Calendar className="w-4 h-4 text-[#B45309]" />
          </div>

          <ul className="divide-y divide-[#F1EDE4]">
            {events.map((evt) => (
              <li key={evt.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-[#1E1B18]">{evt.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#645D55]">
                  <span>{evt.dateLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{evt.timeLabel}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[#B45309]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{evt.location}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-3">
          <h3 className="text-base font-bold text-[#1E1B18]">
            {activeMember ? 'Your Member Profile' : 'Join the Kutumb Directory'}
          </h3>
          {activeMember ? (
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-[#1E1B18]">{activeMember.name}</p>
              <p className="text-[#645D55]">
                {activeMember.gotra} Gotra · {activeMember.city}
              </p>
              <p className="font-mono text-xs text-[#B45309] pt-1">
                ID: {activeMember.memberCode} · {activeMember.status}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#645D55]">
                Register online to receive your official Shri Garhveer Baba Math Digital ID card.
              </p>
              <button
                type="button"
                onClick={onGoToMembership}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#C2410C] text-[#C2410C] hover:bg-orange-50 text-sm font-semibold transition-colors cursor-pointer"
              >
                Register Membership
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
