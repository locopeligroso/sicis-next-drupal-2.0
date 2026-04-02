"use client"

import { Fragment } from "react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface BreadcrumbSegment {
  label: string
  href: string
  /** If present, this segment renders a dropdown with sibling pages */
  siblings?: { label: string; href: string }[]
}

interface SmartBreadcrumbProps {
  segments: BreadcrumbSegment[]
  className?: string
}

export function SmartBreadcrumb({ segments, className }: SmartBreadcrumbProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1
          const hasSiblings = segment.siblings && segment.siblings.length > 0

          return (
            <Fragment key={i}>
              <BreadcrumbItem>
                {hasSiblings && segment.siblings ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={
                        isLast
                          ? "font-normal text-foreground"
                          : "transition-colors hover:text-foreground"
                      }
                    >
                      {segment.label}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {segment.siblings.map((sibling) => (
                        <DropdownMenuItem
                          key={sibling.href}
                          className={
                            sibling.href === segment.href
                              ? "font-semibold text-foreground"
                              : ""
                          }
                          render={<Link href={sibling.href} />}
                        >
                          {sibling.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={segment.href} />}>
                    {segment.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
