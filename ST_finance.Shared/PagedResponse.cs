using System;
using System.Collections.Generic;

namespace ST_finance.Shared;

public class PagedResponse<T>
{
    public PagedResponse(IReadOnlyList<T> items, int count, int pageNumber, int pageSize)
    {
        Items = items;
        TotalCount = count;
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);
    }

    public IReadOnlyList<T> Items { get; }
    public int PageNumber { get; }
    public int PageSize { get; }
    public int TotalCount { get; }
    public int TotalPages { get; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    public static PagedResponse<T> Create(IReadOnlyList<T> items, int count, int pageNumber, int pageSize)
    {
        return new PagedResponse<T>(items, count, pageNumber, pageSize);
    }
}
