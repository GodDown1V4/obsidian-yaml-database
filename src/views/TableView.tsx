import React from 'react'
import { App, Plugin } from 'obsidian'
import DataGrid from 'components/DataGrid'
import ErrorBoundary from 'components/ErrorBoundary'
import '../styles/TableView.css'
import YamlDatabasePlugin from 'main'
import { dbconfig } from 'yaml/parse'

interface Props {
  databaseID: string
  plugin: YamlDatabasePlugin
  paginationSize: number
}

export default class TableView extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  render(): React.ReactNode {
    return (
      <ErrorBoundary>
        <DataGrid
          databaseID={this.props.databaseID}
          plugin={this.props.plugin}
          paginationSize={this.props.paginationSize}
        ></DataGrid>
      </ErrorBoundary>
    )
  }
}
