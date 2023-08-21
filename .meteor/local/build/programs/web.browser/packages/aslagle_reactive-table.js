//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Template = Package['templating-runtime'].Template;
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var i18n = Package['anti:i18n'].i18n;
var Mongo = Package.mongo.Mongo;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var get, oldField, sortedRows, normalizeSort, getSortedFields, getSortQuery, sortWithFunctions, getPrimarySortField, changePrimarySort, getFilterQuery, ReactiveTable, dependOnFilters, getFilterStrings, getFilterFields;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/aslagle_reactive-table/lib/template.reactive_table.js                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //

Template.__checkName("reactiveTable");
Template["reactiveTable"] = new Template("Template.reactiveTable", (function() {
  var view = this;
  return Spacebars.With(function() {
    return Spacebars.call(view.lookup("context"));
  }, function() {
    return [ "\n  ", Blaze.If(function() {
      return Spacebars.call(view.lookup("ready"));
    }, function() {
      return [ "\n    ", HTML.DIV({
        class: "clearfix"
      }, "\n      ", HTML.DIV({
        class: "reactive-table-options col-sm-8 pull-right"
      }, "\n        ", Blaze.If(function() {
        return Spacebars.call(view.lookup("showFilter"));
      }, function() {
        return [ "\n          ", HTML.DIV({
          class: "reactive-table-filter form-group col-sm-8 pull-right"
        }, "\n            ", Blaze._TemplateWith(function() {
          return {
            id: Spacebars.call(view.lookup("getFilterId")),
            useFontAwesome: Spacebars.call(view.lookup("useFontAwesome"))
          };
        }, function() {
          return Spacebars.include(view.lookupTemplate("reactiveTableFilter"));
        }), "\n          "), "\n        " ];
      }), "\n        ", Blaze.If(function() {
        return Spacebars.call(view.lookup("showColumnToggles"));
      }, function() {
        return [ "\n          ", HTML.DIV({
          class: "reactive-table-columns-dropdown col-sm-4 pull-right"
        }, "\n            ", HTML.BUTTON({
          class: "btn btn-default dropdown-toggle",
          id: function() {
            return [ "reactive-table-add-column-", Spacebars.mustache(view.lookup("id")) ];
          },
          "data-toggle": "dropdown"
        }, "\n              ", Blaze.View("lookup:i18n", function() {
          return Spacebars.mustache(view.lookup("i18n"), "reactiveTable.columns");
        }), "\n            "), "\n            ", HTML.UL({
          class: "dropdown-menu dropdown-menu-right",
          role: "menu",
          "aria-labelledby": function() {
            return [ "reactive-table-add-column-", Spacebars.mustache(view.lookup("id")) ];
          }
        }, "\n              ", Blaze.Each(function() {
          return Spacebars.call(view.lookup("fields"));
        }, function() {
          return [ "\n                ", Blaze.Unless(function() {
            return Spacebars.call(view.lookup("hideToggle"));
          }, function() {
            return [ "\n                  ", HTML.LI({
              role: "presentation"
            }, HTML.A({
              role: "menuitem",
              tabindex: "-1",
              "data-target": "#"
            }, "\n                    ", Blaze.If(function() {
              return Spacebars.call(view.lookup("isVisible"));
            }, function() {
              return [ "\n                      ", HTML.INPUT({
                type: "checkbox",
                checked: "",
                "data-fieldid": function() {
                  return Spacebars.mustache(view.lookup("fieldId"));
                }
              }), "\n                    " ];
            }, function() {
              return [ "\n                      ", HTML.INPUT({
                type: "checkbox",
                "data-fieldid": function() {
                  return Spacebars.mustache(view.lookup("fieldId"));
                }
              }), "\n                    " ];
            }), "\n                    ", HTML.LABEL("\n                      ", Blaze.If(function() {
              return Spacebars.call(view.lookup("labelIsTemplate"));
            }, function() {
              return Spacebars.With(function() {
                return Spacebars.call(view.lookup("labelData"));
              }, function() {
                return Spacebars.include(function() {
                  return Spacebars.call(Spacebars.dot(view.lookup(".."), "label"));
                });
              }, function() {
                return Spacebars.include(view.lookupTemplate("label"));
              });
            }, function() {
              return Blaze.View("lookup:getLabel", function() {
                return Spacebars.mustache(view.lookup("getLabel"));
              });
            }), "\n                    "), "\n                  ")), "\n                " ];
          }), "\n              " ];
        }), "\n            "), "\n          "), "\n        " ];
      }), "\n      "), "\n    "), "\n    ", Blaze.Unless(function() {
        return Spacebars.call(view.lookup("noData"));
      }, function() {
        return [ "\n      ", HTML.TABLE({
          id: function() {
            return Spacebars.mustache(view.lookup("id"));
          },
          class: function() {
            return [ Spacebars.mustache(view.lookup("class")), " reactive-table" ];
          }
        }, "\n        ", HTML.THEAD("\n          ", HTML.TR("\n            ", Blaze.Each(function() {
          return Spacebars.call(view.lookup("fields"));
        }, function() {
          return [ "\n              ", Blaze.If(function() {
            return Spacebars.call(view.lookup("isVisible"));
          }, function() {
            return [ "\n                ", Blaze.If(function() {
              return Spacebars.call(view.lookup("isPrimarySortField"));
            }, function() {
              return [ "\n                  ", HTML.TH({
                class: function() {
                  return [ Blaze.If(function() {
                    return Spacebars.call(view.lookup("isSortable"));
                  }, function() {
                    return "sortable ";
                  }), Spacebars.mustache(view.lookup("getHeaderClass")) ];
                },
                fieldid: function() {
                  return Spacebars.mustache(view.lookup("getFieldFieldId"));
                }
              }, "\n                    ", Blaze.If(function() {
                return Spacebars.call(view.lookup("labelIsTemplate"));
              }, function() {
                return Spacebars.With(function() {
                  return Spacebars.call(view.lookup("labelData"));
                }, function() {
                  return Spacebars.include(function() {
                    return Spacebars.call(Spacebars.dot(view.lookup(".."), "label"));
                  });
                }, function() {
                  return Spacebars.include(view.lookupTemplate("label"));
                });
              }, function() {
                return Blaze.View("lookup:getLabel", function() {
                  return Spacebars.mustache(view.lookup("getLabel"));
                });
              }), HTML.CharRef({
                html: "&nbsp;",
                str: " "
              }), HTML.CharRef({
                html: "&nbsp;",
                str: " "
              }), "\n                    ", Blaze.If(function() {
                return Spacebars.call(view.lookup("isAscending"));
              }, function() {
                return [ "\n                      ", Blaze.If(function() {
                  return Spacebars.call(Spacebars.dot(view.lookup(".."), "useFontAwesome"));
                }, function() {
                  return [ "\n                        ", HTML.I({
                    class: "fa fa-sort-asc"
                  }), "\n                      " ];
                }, function() {
                  return [ "\n                        ", HTML.CharRef({
                    html: "&#x25B2;",
                    str: "▲"
                  }), "\n                      " ];
                }), "\n                    " ];
              }, function() {
                return [ "\n                      ", Blaze.If(function() {
                  return Spacebars.call(Spacebars.dot(view.lookup(".."), "useFontAwesome"));
                }, function() {
                  return [ "\n                        ", HTML.I({
                    class: "fa fa-sort-desc"
                  }), "\n                      " ];
                }, function() {
                  return [ "\n                        ", HTML.CharRef({
                    html: "&#x25BC;",
                    str: "▼"
                  }), "\n                      " ];
                }), "\n                    " ];
              }), "\n                  "), "\n                " ];
            }, function() {
              return [ "\n                  ", Blaze.If(function() {
                return Spacebars.call(view.lookup("isSortable"));
              }, function() {
                return [ "\n                    ", HTML.TH({
                  class: function() {
                    return [ Spacebars.mustache(view.lookup("getHeaderClass")), " sortable" ];
                  },
                  fieldid: function() {
                    return Spacebars.mustache(view.lookup("getFieldFieldId"));
                  }
                }, Blaze.If(function() {
                  return Spacebars.call(view.lookup("labelIsTemplate"));
                }, function() {
                  return Spacebars.With(function() {
                    return Spacebars.call(view.lookup("labelData"));
                  }, function() {
                    return Spacebars.include(function() {
                      return Spacebars.call(Spacebars.dot(view.lookup(".."), "label"));
                    });
                  }, function() {
                    return Spacebars.include(view.lookupTemplate("label"));
                  });
                }, function() {
                  return Blaze.View("lookup:getLabel", function() {
                    return Spacebars.mustache(view.lookup("getLabel"));
                  });
                })), "\n                  " ];
              }, function() {
                return [ "\n                    ", HTML.TH({
                  class: function() {
                    return Spacebars.mustache(view.lookup("getHeaderClass"));
                  },
                  fieldid: function() {
                    return Spacebars.mustache(view.lookup("getFieldFieldId"));
                  }
                }, Blaze.If(function() {
                  return Spacebars.call(view.lookup("labelIsTemplate"));
                }, function() {
                  return Spacebars.With(function() {
                    return Spacebars.call(view.lookup("labelData"));
                  }, function() {
                    return Spacebars.include(function() {
                      return Spacebars.call(Spacebars.dot(view.lookup(".."), "label"));
                    });
                  }, function() {
                    return Spacebars.include(view.lookupTemplate("label"));
                  });
                }, function() {
                  return Blaze.View("lookup:getLabel", function() {
                    return Spacebars.mustache(view.lookup("getLabel"));
                  });
                })), "\n                  " ];
              }), "\n                " ];
            }), "\n              " ];
          }), "\n            " ];
        }), "\n          "), "\n        "), "\n        ", HTML.TBODY("\n          ", Blaze.Each(function() {
          return Spacebars.call(view.lookup("sortedRows"));
        }, function() {
          return [ "\n            ", HTML.TR({
            class: function() {
              return Spacebars.mustache(Spacebars.dot(view.lookup(".."), "rowClass"), view.lookup("."));
            }
          }, "\n              ", Blaze.Each(function() {
            return Spacebars.call(Spacebars.dot(view.lookup(".."), "fields"));
          }, function() {
            return [ "\n                ", Blaze.If(function() {
              return Spacebars.call(view.lookup("isVisible"));
            }, function() {
              return [ "\n                  ", HTML.TD({
                class: function() {
                  return Spacebars.mustache(view.lookup("getCellClass"), view.lookup(".."));
                }
              }, Blaze.If(function() {
                return Spacebars.call(view.lookup("tmpl"));
              }, function() {
                return Spacebars.With(function() {
                  return Spacebars.call(view.lookup(".."));
                }, function() {
                  return Spacebars.include(function() {
                    return Spacebars.call(Spacebars.dot(view.lookup(".."), "tmpl"));
                  });
                });
              }, function() {
                return Blaze.View("lookup:getField", function() {
                  return Spacebars.mustache(view.lookup("getField"), view.lookup(".."));
                });
              })), "\n                " ];
            }), "\n              " ];
          }), "\n            "), "\n          " ];
        }), "\n        "), "\n      "), "\n      ", Blaze.If(function() {
          return Spacebars.call(view.lookup("showNavigation"));
        }, function() {
          return [ "\n        ", HTML.DIV({
            class: "reactive-table-navigation"
          }, "\n          ", Blaze.If(function() {
            return Spacebars.call(view.lookup("showNavigationRowsPerPage"));
          }, function() {
            return [ "\n            ", HTML.DIV({
              class: "form-inline form-group rows-per-page"
            }, "\n              ", HTML.LABEL("\n                ", HTML.SPAN(Blaze.View("lookup:i18n", function() {
              return Spacebars.mustache(view.lookup("i18n"), "reactiveTable.show");
            })), "\n                ", HTML.INPUT({
              class: "form-control",
              type: "text",
              value: function() {
                return Spacebars.mustache(view.lookup("getRowsPerPage"));
              }
            }), "\n                ", Blaze.If(function() {
              return Spacebars.call(view.lookup("showRowCount"));
            }, function() {
              return [ "\n                  ", HTML.SPAN(Blaze.View("lookup:i18n", function() {
                return Spacebars.mustache(view.lookup("i18n"), "reactiveTable.of");
              })), "\n                  ", HTML.SPAN({
                class: "rows-per-page-count"
              }, Blaze.View("lookup:getRowCount", function() {
                return Spacebars.mustache(view.lookup("getRowCount"));
              })), "\n                " ];
            }), "\n                ", HTML.SPAN({
              class: "rows-per-page-label"
            }, Blaze.View("lookup:i18n", function() {
              return Spacebars.mustache(view.lookup("i18n"), "reactiveTable.rowsPerPage");
            })), "\n              "), "\n            "), "\n          " ];
          }), "\n          ", HTML.DIV({
            class: "form-inline form-group page-number"
          }, "\n            ", Blaze.If(function() {
            return Spacebars.call(view.lookup("isntFirstPage"));
          }, function() {
            return [ "\n              ", Blaze.If(function() {
              return Spacebars.call(view.lookup("useFontAwesome"));
            }, function() {
              return [ "\n                ", HTML.I({
                class: "previous-page fa fa-caret-left"
              }), "\n              " ];
            }, function() {
              return [ "\n                ", HTML.LABEL({
                class: "previous-page"
              }, HTML.CharRef({
                html: "&lt;",
                str: "<"
              })), "\n              " ];
            }), "\n            " ];
          }), "\n            ", HTML.LABEL("\n              ", HTML.SPAN(Blaze.View("lookup:i18n", function() {
            return Spacebars.mustache(view.lookup("i18n"), "reactiveTable.page");
          })), "\n              ", HTML.INPUT({
            class: "form-control",
            type: "text",
            value: function() {
              return Spacebars.mustache(view.lookup("getCurrentPage"));
            }
          }), "\n              ", HTML.SPAN(Blaze.View("lookup:i18n", function() {
            return Spacebars.mustache(view.lookup("i18n"), "reactiveTable.of");
          })), "\n              ", HTML.SPAN({
            class: "page-number-count"
          }, Blaze.View("lookup:getPageCount", function() {
            return Spacebars.mustache(view.lookup("getPageCount"));
          })), "\n            "), "\n            ", Blaze.If(function() {
            return Spacebars.call(view.lookup("isntLastPage"));
          }, function() {
            return [ "\n              ", Blaze.If(function() {
              return Spacebars.call(view.lookup("useFontAwesome"));
            }, function() {
              return [ "\n                ", HTML.I({
                class: "next-page fa fa-caret-right"
              }), "\n              " ];
            }, function() {
              return [ "\n                ", HTML.LABEL({
                class: "next-page"
              }, HTML.CharRef({
                html: "&gt;",
                str: ">"
              })), "\n              " ];
            }), "\n            " ];
          }), "\n          "), "\n        "), "\n      " ];
        }), "\n    " ];
      }, function() {
        return [ "\n      ", Spacebars.include(view.lookupTemplate("noDataTmpl")), "\n    " ];
      }), "\n  " ];
    }), "\n  " ];
  });
}));

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/aslagle_reactive-table/lib/template.filter.js                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //

Template.__checkName("reactiveTableFilter");
Template["reactiveTableFilter"] = new Template("Template.reactiveTableFilter", (function() {
  var view = this;
  return HTML.DIV({
    id: function() {
      return Spacebars.mustache(view.lookup("id"));
    },
    class: function() {
      return Spacebars.mustache(view.lookup("class"));
    }
  }, "\n    ", HTML.SPAN({
    class: "input-group-addon"
  }, "\n      ", Blaze.If(function() {
    return Spacebars.call(view.lookup("useFontAwesome"));
  }, function() {
    return [ "\n        ", HTML.I({
      class: "fa fa-filter"
    }), "\n      " ];
  }, function() {
    return [ "\n        ", Blaze.If(function() {
      return Spacebars.call(view.lookup("label"));
    }, function() {
      return [ "\n          ", HTML.SPAN(Blaze.View("lookup:label", function() {
        return Spacebars.mustache(view.lookup("label"));
      })), "\n        " ];
    }, function() {
      return [ "\n          ", Blaze.View("lookup:i18n", function() {
        return Spacebars.mustache(view.lookup("i18n"), "reactiveTable.filter");
      }), "\n        " ];
    }), "\n      " ];
  }), "\n    "), "\n    ", Blaze.If(function() {
    return Spacebars.call(view.lookup("useFontAwesome"));
  }, function() {
    return [ "\n      ", Blaze.If(function() {
      return Spacebars.call(view.lookup("label"));
    }, function() {
      return [ "\n        ", HTML.INPUT({
        class: "reactive-table-input form-control",
        type: "text",
        value: function() {
          return Spacebars.mustache(view.lookup("filter"));
        },
        placeholder: function() {
          return Spacebars.mustache(view.lookup("label"));
        }
      }), "\n      " ];
    }, function() {
      return [ "\n        ", HTML.INPUT({
        class: "reactive-table-input form-control",
        type: "text",
        value: function() {
          return Spacebars.mustache(view.lookup("filter"));
        },
        placeholder: function() {
          return Spacebars.mustache(view.lookup("i18n"), "reactiveTable.filter");
        }
      }), "\n      " ];
    }), "\n    " ];
  }, function() {
    return [ "\n      ", HTML.INPUT({
      class: "reactive-table-input form-control",
      type: "text",
      value: function() {
        return Spacebars.mustache(view.lookup("filter"));
      }
    }), "\n    " ];
  }), "\n  ");
}));

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/aslagle_reactive-table/lib/reactive_table_i18n.js                                                        //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
i18n.map('en', {
    reactiveTable: {
        filter: 'Filter',
        columns: 'Columns',
        show: 'Show',
        rowsPerPage: 'rows per page',
        page: 'Page',
        of: 'of'
    }
});

i18n.map('fr', {
    reactiveTable: {
        filter: 'Filtre',
        columns: 'Colonnes',
        show: 'Voir',
        rowsPerPage: 'lignes par page',
        page: 'page',
        of: 'sur'
    }
});

i18n.map('ru', {
    reactiveTable: {
        filter: 'Фильтр',
        columns: 'Колонки',
        show: 'Показать',
        rowsPerPage: 'строк на странице',
        page: 'Страница',
        of: 'из'
    }
});

i18n.map('es', {
    reactiveTable: {
        filter: 'Filtro',
        columns: 'Columnas',
        show:   'Mostrar',
        rowsPerPage: 'filas por página',
        page: 'Página',
        of: 'de'
    }
});

i18n.map('nl', {
    reactiveTable: {
        filter: 'Filter',
        show:   'Toon',
        rowsPerPage: 'regels per pagina',
        page: 'Pagina',
        of: 'van'
    }
});

i18n.map('pt-br', {
    reactiveTable: {
        filter: 'Filtro',
        show: 'Mostrar',
        rowsPerPage: 'linhas por página',
        page: 'Página',
        of: 'de'
    }
});

i18n.map('pt', {
    reactiveTable: {
        filter: 'Filtro',
        show: 'Mostrar',
        rowsPerPage: 'linhas por página',
        page: 'Página',
        of: 'de'
    }
});

i18n.map('it', {
    reactiveTable: {
        filter: 'Filtra',
        show: 'Mostra',
        rowsPerPage: 'righe per pagina',
        page: 'Pagina',
        of: 'di'
    }
});

i18n.map('sv', {
    reactiveTable: {
        filter: 'Filter',
        show: 'Visa',
        rowsPerPage: 'rader per sida',
        page: 'Sida',
        of: 'av'
    }
});

i18n.map('ua', {
    reactiveTable: {
        filter: 'Фільтр',
        show: 'Показати',
        rowsPerPage: 'рядків на сторінці',
        page: 'Сторінка',
        of: 'з'
    }
});

i18n.map('tr', {
    reactiveTable: {
        filter: 'Süz',
        columns: 'Sütunlar',
        show: 'Sayfa başına',
        rowsPerPage: 'satır göster',
        page: 'Sayfa',
        of: ' / '
    }
});

i18n.map('sk', {
    reactiveTable: {
        filter: 'Filter',
        show: 'Zobraz',
        rowsPerPage: 'riadkov na stranu',
        page: 'Strana',
        of: 'z'
    }
});

i18n.map('cs', {
    reactiveTable: {
        filter: 'Filter',
        show: 'Zobraz',
        rowsPerPage: 'řádků na stranu',
        page: 'Strana',
        of: 'z'
    }
});

i18n.map('he', {
    reactiveTable: {
        filter: 'פילטר',
        show: 'הצג',
        rowsPerPage: 'שורות לעמוד',
        page: 'עמוד',
        of: 'מתוך'
    }
});

i18n.map('da', {
    reactiveTable: {
        filter: 'Filter',
        columns: 'Kolonner',
        show: 'Vis',
        rowsPerPage: 'rækker per side',
        page: 'Side',
        of: 'af'
    }
});

i18n.map('de', {
    reactiveTable: {
        filter: 'Filter',
        columns: 'Spalten',
        show: 'Zeige',
        rowsPerPage: 'Zeilen pro Seite',
        page: 'Seite',
        of: 'von'
    }
});

i18n.map('fi', {
    reactiveTable: {
        filter: 'Suodata',
        show: 'Näytä',
        rowsPerPage: 'riviä sivulla',
        page: 'Sivu',
        of: ' / '
    }
});

i18n.map('no', {
    reactiveTable: {
        filter: 'Filter',
        columns: 'Kolonner',
        show: 'Vis',
        rowsPerPage: 'rader per side',
        page: 'Side',
        of: 'av'
    }
});

i18n.map('pl', {
    reactiveTable: {
        filter: 'Szukaj',
        columns: 'Kolumny',
        show: 'Pokaż',
        rowsPerPage: 'pozycji na stronie',
        page: 'Strona',
        of: 'z'
    }
});

i18n.map('hr', {
    reactiveTable: {
        filter: 'Filter',
        columns: 'Stupci',
        show: 'Prikaži',
        rowsPerPage: 'redova po stranici',
        page: 'Stranica',
        of: 'od'
    }
});

i18n.map('is', {
    reactiveTable: {
        filter: 'Sía',
        columns: 'Dálkar',
        show: 'Sýna',
        rowsPerPage: 'raðir á síðu',
        page: 'Síða',
        of: 'af'
    }
});

i18n.map('zh', {
    reactiveTable: {
        filter: '过滤',
        columns: '列',
        show: '显示',
        rowsPerPage: '每页行数',
        page: '页数',
        of: '之'
    }
});

i18n.map('zh-tw', {
    reactiveTable: {
        filter: '過濾',
        columns: '列',
        show: '顯示',
        rowsPerPage: '每頁行數',
        page: '頁數',
        of: '之'
    }
});

i18n.map('fa', {
    reactiveTable: {
        filter: 'تزکیه',
        columns: 'ستون',
        show: 'ارائه',
        rowsPerPage: 'ردیف در هر صفحه',
        page: 'صفحه',
        of: 'از'
    }
});

i18n.map('gr', {
    reactiveTable: {
        filter: 'Φίλτρα',
        columns: 'Στήλες',
        show: 'Προβολή',
        rowsPerPage: 'γραμμές ανά σελίδα',
        page: 'Σελίδα',
        of: 'από'
    }
});

i18n.map('bg', {
    reactiveTable: {
        filter: 'Филтър',
        columns: 'Колони',
        show: 'Покажи',
        rowsPerPage: 'реда на страница',
        page: 'Страница',
        of: 'от'
    }
});

i18n.map('mk', {
    reactiveTable: {
        filter: 'Филтер',
        columns: 'Колони',
        show: 'Покажи',
        rowsPerPage: 'Редови на страница',
        page: 'Страница',
        of: 'од'
    }
});

i18n.map('ro', {
    reactiveTable: {
        filter: 'Filtru',
        columns: 'Coloane',
        show: 'Arată',
        rowsPerPage: 'rânduri per pagină',
        page: 'Pagină',
        of: 'din'
    }
});

i18n.map('ar', {
    reactiveTable: {
        filter: 'رشح',
        columns: 'الأعمدة',
        show: 'اظهر',
        rowsPerPage: 'الصفوف بالصفحة',
        page: 'الصفحة',
        of: 'من'
    }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/aslagle_reactive-table/lib/reactive_table.js                                                             //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var ReactiveTableCounts = new Mongo.Collection("reactive-table-counts");

get = function(obj, field) {
  var keys = field.split('.');
  var value = obj;

  _.each(keys, function (key) {
      if (_.isObject(value) && _.isFunction(value[key])) {
          value = value[key]();
      } else if (_.isObject(value) && !_.isUndefined(value[key])) {
          value = value[key];
      } else {
          value = null;
      }
  });

  return value;
};

var updateHandle = function (set_context) {
    var context = set_context;
    if (context.server) {
        var newHandle;

        // Could use the table id, but this way we can wait to change the
        // page until the new data is ready, so it doesn't move around
        // while rows are added and removed
        var publicationId = _.uniqueId();
        var newPublishedRows = new Mongo.Collection('reactive-table-rows-' + publicationId);
        context.nextPublicationId.set(publicationId);

        var rowsPerPage = context.rowsPerPage.get();
        var currentPage = context.currentPage.get();
        var currentIndex = currentPage * rowsPerPage;

        var options = {
            skip: currentIndex,
            limit: rowsPerPage,
            sort: getSortQuery(context.fields, context.multiColumnSort)
        };

        var filters = context.filters.get();

        var onReady = function () {
            if (publicationId === context.nextPublicationId.get()) {
                context.ready.set(true);
                context.publicationId.set(publicationId);
                context.publishedRows = newPublishedRows;
                var oldHandle = context.handle;
                context.handle = newHandle;

                if (oldHandle) {
                    oldHandle.stop();
                }
            } else {
                // another handle was created after this one
                newHandle.stop();
            }
        };
        var onError = function (error) {
            console.log("ReactiveTable subscription error: " + error);
        };
        newHandle = Meteor.subscribe(
            "reactive-table-" + context.collection,
            publicationId,
            getFilterStrings(filters),
            getFilterFields(filters, context.fields),
            options,
            context.rowsPerPage.get(),
            {onReady: onReady, onError: onError}
        );
    }
};


var getDefaultFalseSetting = function (key, templateData) {
    if (!_.isUndefined(templateData[key]) &&
        templateData[key]) {
        return true;
    }
    if (!_.isUndefined(templateData.settings) &&
        !_.isUndefined(templateData.settings[key]) &&
        templateData.settings[key]) {
        return true;
    }
    return false;
};

var getDefaultTrueSetting = function (key, templateData) {
    if (!_.isUndefined(templateData[key]) &&
        !templateData[key]) {
        return false;
    }
    if (!_.isUndefined(templateData.settings) &&
        !_.isUndefined(templateData.settings[key]) &&
        !templateData.settings[key]) {
        return false;
    }
    return true;
};



var setup = function () {
    var context = {};
    var oldContext = this.context || {};
    context.templateData = this.data;
    this.data.settings = this.data.settings || {};
    var collection = this.data.collection || this.data.settings.collection || this.data;

    if (!(collection instanceof Mongo.Collection)) {
        if (_.isArray(collection)) {
            // collection is an array
            // create a new collection from the data
            var data = collection;
            collection = new Mongo.Collection(null);
            _.each(data, function (doc) {
                collection.insert(doc);
            });
        } else if (_.isFunction(collection.fetch)) {
            // collection is a cursor
            // create a new collection that will reactively update
            var cursor = collection;
            collection = new Mongo.Collection(null);

            // copy over transforms from collection-helper package
            collection._transform = cursor._transform;
            collection._name = cursor.collection._name;

            var addedCallback = function (doc) {
                collection.insert(doc);
            };
            var changedCallback = function (doc, oldDoc) {
                collection.update(oldDoc._id, doc);
            };
            var removedCallback = function (oldDoc) {
                collection.remove(oldDoc._id);
            };
            cursor.observe({added: addedCallback, changed: changedCallback, removed: removedCallback});
        } else if (_.isString(collection)) {
            // server side publication
            context.server = true;
            context.publicationId = new ReactiveVar();
            context.nextPublicationId = new ReactiveVar();
            context.publishedRows = new Mongo.Collection(null);
        } else {
            console.error("reactiveTable error: argument is not an instance of Mongo.Collection, a cursor, or an array");
            collection = new Mongo.Collection(null);
        }
    }
    context.collection = collection;

    context.multiColumnSort = getDefaultTrueSetting('multiColumnSort', this.data);

    var fields = this.data.fields || this.data.settings.fields || {};
    if (_.keys(fields).length < 1 ||
        (_.keys(fields).length === 1 &&
         _.keys(fields)[0] === 'hash')) {

        if (context.server) {
            console.error("reactiveTable error: fields option is required with server-side publications");
        } else {
            fields = _.without(_.keys(collection.findOne() || {}), '_id');
            if (fields.length < 1) {
                console.error("reactiveTable error: Couldn't get fields from an item in the collection on load, so there are no columns to display. Provide the fields option or ensure that the collection has at least one item and the subscription is ready when the table renders.");
            }
        }
    }

    var fieldIdsArePresentAndUnique = function (fields) {
        var uniqueFieldIds = _.chain(fields)
            .filter(function (field) {
                return !_.isUndefined(field.fieldId)
            })
            .map(function (field) {
                return field.fieldId;
            })
            .uniq()
            .value();
        return uniqueFieldIds.length === fields.length;
    };

    // If at least one field specifies a fieldId, all fields must specify a
    // fieldId with a unique value
    if (_.find(fields, function (field) {
        return !_.isUndefined(field.fieldId)
        }) && !fieldIdsArePresentAndUnique(fields)) {
        console.error("reactiveTable error: all fields must have a unique-valued fieldId if at least one has a fieldId attribute");
        fields = [];
    }

    var normalizeField = function (field, i) {
        if (typeof field === 'string') {
            field = {key: field, label: field};
        }
        if (!_.has(field, 'fieldId')) {
            // Default fieldId to index in fields array if not present
            field.fieldId = i.toString();
        }
        if (!_.has(field, 'key')) {
            field.key = '';
        }
        oldField = _.find(oldContext.fields, function (oldField) {
            return oldField.fieldId === field.fieldId;
        });
        normalizeSort(field, oldField);
        return field;
    };

    fields = _.map(fields, normalizeField);

    context.fields = fields;

    var visibleFields = [];
    _.each(fields, function (field, i) {
        visibleFields.push({fieldId:field.fieldId, isVisible: getDefaultFieldVisibility(field)});
    });
    context.visibleFields = (!_.isUndefined(oldContext.visibleFields) && !_.isEmpty(oldContext.visibleFields)) ? oldContext.visibleFields : new ReactiveVar(visibleFields);


    var rowClass = this.data.rowClass || this.data.settings.rowClass || function() {return '';};
    if (typeof rowClass === 'string') {
        var tmp = rowClass;
        rowClass = function(obj) { return tmp; };
    }
    context.rowClass = rowClass;

    context.class = this.data.class || this.data.settings.class || 'table table-striped table-hover col-sm-12';
    context.id = this.data.id || this.data.settings.id || _.uniqueId('reactive-table-');

    context.showNavigation = this.data.showNavigation || this.data.settings.showNavigation || 'always';
    context.showNavigationRowsPerPage = getDefaultTrueSetting('showNavigationRowsPerPage', this.data);
    context.showRowCount = getDefaultFalseSetting('showRowCount', this.data)

    var rowsPerPage;
    if (!_.isUndefined(oldContext.rowsPerPage)) {
        rowsPerPage = oldContext.rowsPerPage;
    } else if (this.data.rowsPerPage && this.data.rowsPerPage instanceof ReactiveVar) {
        rowsPerPage = this.data.rowsPerPage;
    } else if (this.data.settings.rowsPerPage && this.data.settings.rowsPerPage instanceof ReactiveVar) {
        rowsPerPage = this.data.settings.rowsPerPage;
    } else {
        rowsPerPage = new ReactiveVar(this.data.rowsPerPage || this.data.settings.rowsPerPage || 10);
    }
    context.rowsPerPage = rowsPerPage;

    var currentPage;
    if (!_.isUndefined(oldContext.currentPage)) {
        currentPage = oldContext.currentPage;
    } else if (this.data.currentPage && this.data.currentPage instanceof ReactiveVar) {
        currentPage = this.data.currentPage;
    } else if (this.data.settings.currentPage && this.data.settings.currentPage instanceof ReactiveVar) {
        currentPage = this.data.settings.currentPage;
    } else {
        currentPage = new ReactiveVar(0);
    }
    context.currentPage = currentPage;

    var filters = this.data.filters || this.data.settings.filters || [];
    if (_.isEmpty(filters)) {
      context.showFilter = getDefaultTrueSetting('showFilter', this.data);
    } else {
      context.showFilter = getDefaultFalseSetting('showFilter', this.data);
    }
    if (context.showFilter) {
      filters.push(context.id + '-filter');
    }
    context.filters = new ReactiveVar(filters);

    dependOnFilters(context.filters.get(), function () {
      if (context.reactiveTableSetup) {
        context.currentPage.set(0);
        updateHandle(context);
      }
    });

    context.showColumnToggles = getDefaultFalseSetting('showColumnToggles', this.data);

    if (_.isUndefined(this.data.useFontAwesome)) {
        if (!_.isUndefined(this.data.settings.useFontAwesome)) {
            context.useFontAwesome = this.data.settings.useFontAwesome;
        } else if (!_.isUndefined(Package['fortawesome:fontawesome'])) {
            context.useFontAwesome = true;
        } else {
            context.useFontAwesome = false;
        }
    } else {
        context.useFontAwesome = this.data.useFontAwesome;
    }
    context.noDataTmpl = this.data.noDataTmpl || this.data.settings.noDataTmpl;
    context.enableRegex = getDefaultFalseSetting('enableRegex', this.data);
    context.filterOperator = this.data.filterOperator || this.data.settings.filterOperator || '$and';

    var ready;
    if (!_.isUndefined(oldContext.ready)) {
        ready = oldContext.ready;
    } else if (this.data.ready && this.data.ready instanceof ReactiveVar) {
        ready = this.data.ready;
    } else if (this.data.settings.ready && this.data.settings.ready instanceof ReactiveVar) {
        ready = this.data.settings.ready;
    } else {
        ready = new ReactiveVar(true);
    }
    context.ready = ready;

    if (context.server) {
        context.ready.set(false);
        updateHandle(context);
    }

    context.reactiveTableSetup = true;

    this.context = context;
};

var getDefaultFieldVisibility = function (field) {
    if (field.isVisible && field.isVisible instanceof ReactiveVar) {
        return field.isVisible;
    }
    return new ReactiveVar(!field.hidden || (_.isFunction(field.hidden) && !field.hidden()));
}

var getRowCount = function () {
    if (this.server) {
        var count = ReactiveTableCounts.findOne(this.publicationId.get());
        return (count ? count.count : 0);
    } else {
        var filterQuery = getFilterQuery(getFilterStrings(this.filters.get()), getFilterFields(this.filters.get(), this.fields), {enableRegex: this.enableRegex, filterOperator: this.filterOperator});
        return this.collection.find(filterQuery).count();
    }
};

var getPageCount = function () {
    var count = getRowCount.call(this);
    var rowsPerPage = this.rowsPerPage.get();
    return Math.ceil(count / rowsPerPage);
};

Template.reactiveTable.onCreated(function() {
   this.updateHandle = _.debounce(updateHandle, 200);

   var rowsPerPage = this.data.rowsPerPage || (this.data.settings && this.data.settings.rowsPerPage);
   var currentPage = this.data.currentPage || (this.data.settings && this.data.settings.currentPage);
   var fields = this.data.fields || (this.data.settings && this.data.settings.fields) || [];

   var template = this;
   Tracker.autorun(function(c) {
     if (rowsPerPage instanceof ReactiveVar) {
       rowsPerPage.dep.depend();
     }
     if (currentPage instanceof ReactiveVar) {
       currentPage.dep.depend();
     }
     _.each(fields, function (field) {
       if (field.sortOrder && field.sortOrder instanceof ReactiveVar) {
         field.sortOrder.dep.depend();
       }
       if (field.sortDirection && field.sortDirection instanceof ReactiveVar) {
         field.sortDirection.dep.depend();
       }
     });
     if (template.context) {
       template.updateHandle(template.context);
     }
   });
});

Template.reactiveTable.onDestroyed(function() {
  if (this.context.server && this.context.handle) {
    this.context.handle.stop();
  }
});

Template.reactiveTable.helpers({
    'context': function () {
        if (!Template.instance().context ||
            !_.isEqual(this, Template.instance().context.templateData)) {
            setup.call(Template.instance());
        }
        return Template.instance().context;
    },

    'ready' : function () {
        return this.ready.get();
    },

    'getFilterId': function () {
        return this.id + '-filter';
    },

    'getField': function (object) {
        var fn = this.fn || function (value) { return value; };
        var key = this.key;
        var value = get(object, key);
        return fn(value, object, key);
    },

    'getFieldIndex': function () {
        return _.indexOf(Template.parentData(1).fields, this);
    },

    'getFieldFieldId': function () {
        return this.fieldId;
    },

    'getKey': function () {
        return this.key;
    },

    'getHeaderClass': function () {
        if (_.isUndefined(this.headerClass)) {
            return this.key;
        }
        var css;
        if (_.isFunction(this.headerClass)) {
            css = this.headerClass();
        } else {
            css = this.headerClass;
        }
        return css;
    },

    'getCellClass': function (object) {
        if (_.isUndefined(this.cellClass)) {
            return this.key;
        }
        var css;
        if (_.isFunction(this.cellClass)) {
            var value = get(object, this.key);
            css = this.cellClass(value, object);
        } else {
            css = this.cellClass;
        }
        return css;
    },

    'labelIsTemplate': function () {
        return this.label && _.isObject(this.label) && this.label instanceof Blaze.Template;
    },

    'getLabel': function () {
        return _.isString(this.label) ? this.label : this.label();
    },

    'isPrimarySortField': function () {
        var parentData = Template.parentData(1);
        var primarySortField = getPrimarySortField(parentData.fields, parentData.multiColumnSort);
        return primarySortField && primarySortField.fieldId === this.fieldId;
    },

    'isSortable': function () {
        return (this.sortable === undefined) ? true : this.sortable;
    },

    'isVisible': function () {
        var self = this; // is a field object
        var topLevelData;
        if (Template.parentData(2) && Template.parentData(2).reactiveTableSetup) {
          topLevelData = Template.parentData(2);
        } else {
          topLevelData = Template.parentData(1);
        }
        var visibleFields = topLevelData.visibleFields.get();
        var fields = topLevelData.fields;

        var visibleField = _.findWhere(visibleFields, {fieldId: self.fieldId});
        if (visibleField) {
            return visibleField.isVisible.get();
        } else {
            // Add field to visibleFields list
            var _isVisible = getDefaultFieldVisibility(self);
            visibleFields.push({fieldId:self.fieldId, isVisible:_isVisible});
            topLevelData.visibleFields.set(visibleFields);
            return _isVisible.get();
        }
    },

    'isAscending' : function () {
        var sortDirection = this.sortDirection.get();
        return (sortDirection === 1);
    },

    'sortedRows': function () {
        if (this.server) {
            return this.publishedRows.find({
              "reactive-table-id": this.publicationId.get()
            }, {
              sort: {
                "reactive-table-sort": 1
              }
            });
        } else  {
            var sortByValue = _.all(getSortedFields(this.fields, this.multiColumnSort), function (field) {
                return field.sortByValue || (!field.fn && !field.sortFn);
            });
            var filterQuery = getFilterQuery(getFilterStrings(this.filters.get()), getFilterFields(this.filters.get(), this.fields), {enableRegex: this.enableRegex, filterOperator: this.filterOperator});

            var limit = this.rowsPerPage.get();
            var currentPage = this.currentPage.get();
            var skip = currentPage * limit;

            if (sortByValue) {

                var sortQuery = getSortQuery(this.fields, this.multiColumnSort);
                return this.collection.find(filterQuery, {
                    sort: sortQuery,
                    skip: skip,
                    limit: limit
                });

            } else {

                var rows = this.collection.find(filterQuery).fetch();
                sortedRows = sortWithFunctions(rows, this.fields, this.multiColumnSort);
                return sortedRows.slice(skip, skip + limit);

            }
        }
    },

    'noData': function () {
        var pageCount = getPageCount.call(this);
        return (pageCount === 0) && this.noDataTmpl;
    },

    'getPageCount' : getPageCount,

    'getRowsPerPage' : function () {
        return this.rowsPerPage.get();
    },

    'getCurrentPage' : function () {
        return 1 + this.currentPage.get();
    },

    'isntFirstPage' : function () {
        return this.currentPage.get() > 0;
    },

    'isntLastPage' : function () {
        var currentPage = 1 + this.currentPage.get();
        var pageCount = getPageCount.call(this);
        return currentPage < pageCount;
    },

    'showNavigation' : function () {
        if (this.showNavigation === 'always') return true;
        if (this.showNavigation === 'never') return false;
        return getPageCount.call(this) > 1;
    },
    'getRowCount': getRowCount
});

Template.reactiveTable.events({
    'click .reactive-table .sortable': function (event) {
        var template = Template.instance();
        var target = $(event.currentTarget);
        var sortFieldId = target.attr('fieldid');
        changePrimarySort(sortFieldId, template.context.fields, template.multiColumnSort);
        template.updateHandle(template.context);
    },

    'click .reactive-table-columns-dropdown li': function (event) {
        var template = Template.instance();
        var target = $(event.currentTarget);
        var fieldId = target.find('input').attr('data-fieldid');
        var visibleFields = template.context.visibleFields.get();
        var visibleField = _.findWhere(visibleFields, {fieldId: fieldId});
        if (visibleField) {
            // Toggle visibility
            visibleField.isVisible.set(!visibleField.isVisible.get());
            template.context.visibleFields.set(visibleFields);
        }
    },

    'change .reactive-table-navigation .rows-per-page input': function (event) {
        var rowsPerPage = Math.max(~~$(event.target).val(), 1);
        var template = Template.instance();
        template.context.rowsPerPage.set(rowsPerPage);
        $(event.target).val(rowsPerPage);

        var currentPage = template.context.currentPage.get() + 1;
        var pageCount = getPageCount.call(this);
        if (currentPage > pageCount) {
          template.context.currentPage.set(pageCount - 1);
        }
        template.updateHandle(template.context);
    },

    'change .reactive-table-navigation .page-number input': function (event) {
        var currentPage = Math.max(~~$(event.target).val(), 1);
        var pageCount = getPageCount.call(this);
        if (currentPage > pageCount) {
          currentPage = pageCount;
        }
        if (currentPage < 0) {
          currentPage = 1;
        }
        var template = Template.instance();
        template.context.currentPage.set(currentPage - 1);
        $(event.target).val(currentPage);
        template.updateHandle(template.context);
    },

    'click .reactive-table-navigation .previous-page': function (event) {
        var template = Template.instance();
        var currentPage = template.context.currentPage.get();
        template.context.currentPage.set(currentPage - 1);
        template.updateHandle(template.context);
    },

    'click .reactive-table-navigation .next-page': function (event) {
        var template = Template.instance();
        var currentPage = template.context.currentPage.get();
        template.context.currentPage.set(currentPage + 1);
        template.updateHandle(template.context);
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/aslagle_reactive-table/lib/sort.js                                                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
normalizeSort = function (field, oldField) {
  // preserve user sort settings
  if (oldField && _.has(oldField, 'sortOrder')) {
    field.sortOrder = oldField.sortOrder;
  }
  if (oldField && _.has(oldField, 'sortDirection')) {
    field.sortDirection = oldField.sortDirection;
  }

  // backwards-compatibility
  if (!_.has(field, 'sortOrder') && _.has(field, 'sort')) {
    console.warn('reactiveTable warning: The "sort" option for fields is deprecated');
    field.sortOrder = 0;
    field.sortDirection = field.sort;
  }


  var sortOrder;

  if (!_.has(field, 'sortOrder')) {
    sortOrder = Infinity;
    field.sortOrder = new ReactiveVar();
  } else if (field.sortOrder instanceof ReactiveVar) {
    sortOrder = field.sortOrder.get()
  } else {
    sortOrder = field.sortOrder;
    field.sortOrder = new ReactiveVar();
  }

  if (!_.isNumber(sortOrder) || sortOrder < 0) {
    console.error('reactiveTable error - sortOrder must be a postive number: ' + sortOrder);
    sortOrder = Infinity;
  }
  field.sortOrder.set(sortOrder);

  var sortDirection;

  if (!_.has(field, 'sortDirection')) {
    sortDirection = 1;
    field.sortDirection = new ReactiveVar()
  } else if (field.sortDirection instanceof ReactiveVar) {
    sortDirection = field.sortDirection.get();
  } else {
    sortDirection = field.sortDirection;
    field.sortDirection = new ReactiveVar();
  }

  if (sortDirection === 'desc' || sortDirection === 'descending' || sortDirection === -1) {
    sortDirection = -1;
  } else if (sortDirection) {
    sortDirection = 1;
  }
  field.sortDirection.set(sortDirection);
};

getSortedFields = function (fields, multiColumnSort) {
  var filteredFields = _.filter(fields, function (field) {
    return field.sortOrder.get() < Infinity;
  });
  if (!filteredFields.length) {
    var firstSortableField = _.find(fields, function (field) {
      return _.isUndefined(field.sortable) || field.sortable !== false;
    });
    if (firstSortableField) {
      filteredFields = [firstSortableField];
    }
  }
  var sortedFields = _.sortBy(filteredFields, function (field) {
    return field.sortOrder.get();
  });
  return multiColumnSort ? sortedFields : sortedFields.slice(0, 1);
}

getSortQuery = function (fields, multiColumnSort) {
  var sortedFields = getSortedFields(fields, multiColumnSort);
  var sortQuery = {};
  _.each(sortedFields, function (field) {
    sortQuery[field.key] = field.sortDirection.get();
  });
  return sortQuery;
};

sortWithFunctions = function (rows, fields, multiColumnSort) {
  var sortedFields = getSortedFields(fields, multiColumnSort);
  var sortedRows = rows;

  _.each(sortedFields.reverse(), function (field) {
    if (field.sortFn) {
      sortedRows = _.sortBy(sortedRows, function (row) {
        return field.sortFn( get( row, field.key ), row );
      });
    } else if (field.sortByValue || !field.fn) {
      sortedRows = _.sortBy(sortedRows, field.key);
    } else {
      sortedRows = _.sortBy(sortedRows, function (row) {
        return field.fn( get( row, field.key ), row );
      });
    }
    if (field.sortDirection.get() === -1) {
      sortedRows.reverse();
    }
  });
  return sortedRows;
};

getPrimarySortField = function (fields, multiColumnSort) {
  return getSortedFields(fields, multiColumnSort)[0];
};

changePrimarySort = function(fieldId, fields, multiColumnSort) {
  var primarySortField = getPrimarySortField(fields, multiColumnSort);
  if (primarySortField && primarySortField.fieldId === fieldId) {
    var sortDirection = -1 * primarySortField.sortDirection.get();
    primarySortField.sortDirection.set(sortDirection);
    primarySortField.sortOrder.set(0);
  } else {
    _.each(fields, function (field) {
      if (field.fieldId === fieldId) {
        field.sortOrder.set(0);
        if (primarySortField) {
          field.sortDirection.set(primarySortField.sortDirection.get());
        }
      } else {
        var sortOrder = 1 + field.sortOrder.get();
        field.sortOrder.set(sortOrder);
      }
    });
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/aslagle_reactive-table/lib/filter.js                                                                     //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var parseFilterString = function (filterString) {
  var startQuoteRegExp = /^[\'\"]/;
  var endQuoteRegExp = /[\'\"]$/;
  var filters = [];
  var words = filterString.split(' ');

  var inQuote = false;
  var quotedWord = '';
  _.each(words, function (word) {
    if (inQuote) {
      if (endQuoteRegExp.test(word)) {
        filters.push(quotedWord + ' ' + word.slice(0, word.length - 1));
        inQuote = false;
        quotedWord = '';
      } else {
        quotedWord = quotedWord + ' ' + word;
      }
    } else if (startQuoteRegExp.test(word)) {
      if (endQuoteRegExp.test(word)) {
        filters.push(word.slice(1, word.length - 1));
      } else {
        inQuote = true;
        quotedWord = word.slice(1, word.length);
      }
    } else {
      filters.push(word);
    }
  });
  return filters;
};

var escapeRegex = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

var getFieldMatches = function (field) {
  var fieldMatches = [];
  var keys = field.split('.');
  var previousKeys = '';
  _.each(keys, function (key) {
    fieldMatches.push(previousKeys + key);
    previousKeys += key + '.';
  });
  var extraMatch = field.replace(/\.\d+\./g, ".");
  if (fieldMatches.indexOf(extraMatch) === -1) fieldMatches.push(extraMatch);
  return fieldMatches;
};

getFilterQuery = function (filterInputs, filterFields, settings) {
  settings = settings || {};
  if (settings.enableRegex === undefined) {
    settings.enableRegex = false;
  }
  if (settings.filterOperator === undefined) {
    settings.filterOperator = "$and";
  }
  if (settings.fields) {
    _.each(filterInputs, function (filter, index) {
      if (_.any(settings.fields, function (include) { return include; })) {
        filterFields[index] = _.filter(filterFields[index], function (field) {
          return _.any(getFieldMatches(field), function (fieldMatch) {
            // ensure that the _id field is filtered on, even if it is not explicitly mentioned
            if (fieldMatch === "_id") return true;
            return settings.fields[fieldMatch];
          });
        });
      } else {
        filterFields[index] = _.filter(filterFields[index], function (field) {
          return _.all(getFieldMatches(field), function (fieldMatch) {
            return _.isUndefined(settings.fields[fieldMatch]) || settings.fields[fieldMatch];
          });
        });
      }
    });
  }
  var numberRegExp = /^\d+$/;
  var queryList = [];
  _.each(filterInputs, function (filter, index) {
    if (filter) {
      if (_.isObject(filter)) {
        var fieldQueries = _.map(filterFields[index], function (field) {
          var query = {};
          query[field] = filter;
          return query;
        });
        if (fieldQueries.length) {
            queryList.push({'$or': fieldQueries});
          }
      } else {
        var filters = parseFilterString(filter);
        _.each(filters, function (filterWord) {
          if (settings.enableRegex === false) {
            filterWord = escapeRegex(filterWord);
          }
          var filterQueryList = [];
          _.each(filterFields[index], function (field) {
            var filterRegExp = new RegExp(filterWord, 'i');
            var query = {};
            query[field] = filterRegExp;
            filterQueryList.push(query);

            if (numberRegExp.test(filterWord)) {
              var numberQuery = {};
              numberQuery[field] = parseInt(filterWord, 10);
              filterQueryList.push(numberQuery);
            }

            if (filterWord === "true") {
              var boolQuery = {};
              boolQuery[field] = true;
              filterQueryList.push(boolQuery);
            } else if (filterWord === "false") {
              var boolQuery = {};
              boolQuery[field] = false;
              filterQueryList.push(boolQuery);
            }
          });

          if (filterQueryList.length) {
            var filterQuery = {'$or': filterQueryList};
            queryList.push(filterQuery);
          }
        });
      }
    }
  });

  var query = {};

  if(queryList.length) {
    query[settings.filterOperator] = queryList;
  }

  return query;
};

if (Meteor.isClient) {
  ReactiveTable = ReactiveTable || {};

  var reactiveTableFilters = {};
  var callbacks = {};

  ReactiveTable.Filter = function (id, fields) {
    if (reactiveTableFilters[id]) {
      reactiveTableFilters[id].fields = fields;
      return reactiveTableFilters[id];
    }

    var filter = new ReactiveVar();

    this.fields = fields;

    this.get = function () {
      return filter.get() || '';
    };

    this.set = function (filterString) {
      filter.set(filterString);
      _.each(callbacks[id], function (callback) {
        callback();
      });
    };

    reactiveTableFilters[id] = this;
  };

  ReactiveTable.clearFilters = function (filterIds) {
    _.each(filterIds, function (filterId) {
      if (reactiveTableFilters[filterId]) {
        reactiveTableFilters[filterId].set('');
      }
    });
  };

  dependOnFilters = function (filterIds, callback) {
    _.each(filterIds, function (filterId) {
      if (_.isUndefined(callbacks[filterId])) {
        callbacks[filterId] = [];
      }
      callbacks[filterId].push(callback);
    });
  };

  getFilterStrings = function (filterIds) {
    return _.map(filterIds, function (filterId) {
      if (_.isUndefined(reactiveTableFilters[filterId])) {
        reactiveTableFilters[filterId] = new ReactiveTable.Filter(filterId);
      }
      return reactiveTableFilters[filterId].get();
    });
  };

  getFilterFields = function (filterIds, allFields) {
    return _.map(filterIds, function (filterId) {
      if (_.isUndefined(reactiveTableFilters[filterId])) {
        return _.map(allFields, function (field) { return field.key; });
      } else if (_.isEmpty(reactiveTableFilters[filterId].fields)) {
        return _.map(allFields, function (field) { return field.key; });
      } else {
        return reactiveTableFilters[filterId].fields;
      }
    });
  };

  Template.reactiveTableFilter.helpers({
    'class': function () {
      return this.class || 'input-group';
    },

    'filter': function () {
      if (_.isUndefined(reactiveTableFilters[this.id])) {
        new ReactiveTable.Filter(this.id, this.fields);
      } else if (_.isUndefined(reactiveTableFilters[this.id].fields)) {
        reactiveTableFilters[this.id].fields = this.fields;
      }
      return reactiveTableFilters[this.id].get();
    }
  });

  var updateFilter = _.debounce(function (template, filterText) {
    reactiveTableFilters[template.data.id].set(filterText);
  }, 200);

  Template.reactiveTableFilter.events({
    'keyup .reactive-table-input, input .reactive-table-input': function (event) {
      var template = Template.instance();
      var filterText = $(event.target).val();
      updateFilter(template, filterText);
    },
  });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("aslagle:reactive-table", {
  ReactiveTable: ReactiveTable
});

})();
