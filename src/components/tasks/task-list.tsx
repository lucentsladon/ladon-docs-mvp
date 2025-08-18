"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { APP_ROUTES } from "@/config/routes"
import { api } from "@/trpc/react"

import { TaskCard } from "./task-card"

export function TaskList() {
  const [page, setPage] = useState(1)
  const { data, isFetching, isLoading } = api.task.list.useQuery(
    { limit: 6, page },
    {
      refetchInterval: 15000, // 15 seconds
      refetchIntervalInBackground: true,
    }
  )

  const tasks = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  // Generate pagination items with ellipsis logic
  const generatePaginationItems = () => {
    const items = []
    const delta = 1 // Number of pages to show on each side of current page

    // Always show first page
    if (totalPages <= 7) {
      // If 7 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(i)
              }}
              isActive={page === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // Complex pagination with ellipsis

      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(1)
            }}
            isActive={page === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )

      // Show ellipsis if current page is far from start
      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      // Show pages around current page
      const start = Math.max(2, page - delta)
      const end = Math.min(totalPages - 1, page + delta)

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(i)
              }}
              isActive={page === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }

      // Show ellipsis if current page is far from end
      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      // Always show last page (if more than 1 page)
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(totalPages)
              }}
              isActive={page === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )
      }
    }

    return items
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-2 lg:flex-row">
        <div>
          <h2 className="font-lora mb-1 text-2xl font-semibold tracking-tight">Your Tasks</h2>
          <p className="mb-6 text-gray-600">
            Below are your recent document translation tasks. You can review, download, and check status.
          </p>
        </div>
        <Button asChild>
          <Link href={APP_ROUTES.UPLOAD}>New Task</Link>
        </Button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-white shadow">
              <div className="flex items-start gap-4 p-6">
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="h-4 w-1/3 rounded bg-gray-200" />
              </div>
              <div className="flex flex-col items-end gap-2 bg-gray-50 p-4">
                <div className="h-9 w-full rounded-md bg-gray-200" />
                <div className="h-9 w-full rounded-md bg-gray-200" />
                <div className="h-9 w-full rounded-md bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="mb-4 text-gray-300">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M7 8V6.4A2.4 2.4 0 0 1 9.4 4h5.2A2.4 2.4 0 0 1 17 6.4V8m-10 0h10m-10 0v9.6A2.4 2.4 0 0 0 9.4 20h5.2a2.4 2.4 0 0 0 2.4-2.4V8m-10 0V6.4A2.4 2.4 0 0 1 9.4 4h5.2A2.4 2.4 0 0 1 17 6.4V8"
            />
          </svg>
          <div className="mb-2 text-lg font-semibold">No translation tasks found</div>
          <div className="text-gray-400">You haven&apos;t created any document translation jobs yet.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(page - 1)
                  }}
                  className={page === 1 ? "pointer-events-none text-gray-400" : ""}
                />
              </PaginationItem>

              {generatePaginationItems()}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(page + 1)
                  }}
                  className={page === totalPages ? "pointer-events-none text-gray-400" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
