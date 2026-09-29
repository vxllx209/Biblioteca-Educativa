import type { Book } from '../types'

export const PARAGRAPHS_PER_PAGE = 3

export interface ReaderPage {
  chapter: number
  chapterTitle: string
  isChapterStart: boolean
  paragraphs: string[]
}

/** Splits a book into fixed pages so that position, percent and bookmarks are stable across sessions. */
export function paginate(book: Book): ReaderPage[] {
  const pages: ReaderPage[] = []
  book.chapters.forEach((chapter, ci) => {
    for (let i = 0; i < chapter.paragraphs.length; i += PARAGRAPHS_PER_PAGE) {
      pages.push({
        chapter: ci,
        chapterTitle: chapter.title,
        isChapterStart: i === 0,
        paragraphs: chapter.paragraphs.slice(i, i + PARAGRAPHS_PER_PAGE),
      })
    }
  })
  return pages
}

export const percentFor = (page: number, total: number) => (total === 0 ? 0 : Math.round(((page + 1) / total) * 100))
